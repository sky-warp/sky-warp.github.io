---
title: How I Built My Own DI Container for a TS
date: 2025-12-21
lang: en
translation_key: own-di-implementation
description: Two deliberately simple dependency-injection implementations for Unity, with a container, installer, attributes, and a couple of honest trade-offs.
---

### Introduction

A few months ago, before I got an offer from my current company, I received a pretty interesting take-home assignment. One of the optional requirements that could improve my chances was using DI. These days, DI frameworks are practically table stakes for a Unity developer, so I was already rubbing my hands together and imagining myself importing Zenject into a fresh project. Then I finished reading the task: third-party DI frameworks were explicitly forbidden. Only a custom solution was allowed.

After looking through a few public implementations and trying different ideas, I eventually wrote a small DI system of my own—actually, two versions of it. It has its own container, installer, and attributes, and that is what I am going to walk through in this article.

### Disclaimer

This is not a tutorial, and I am not claiming that this is the one true way to build DI. I am deliberately not demonstrating perfect SOLID, GRASP, or other principles here—apart from DI itself—because I want to keep both the implementation and the story readable. The solution can absolutely be extended and refactored, but in its current form it handles the jobs I built it for.

It also has weaknesses that may be deal-breakers for some people, so it is only fair to state them up front.

My solution:

- is not ideal for structs: one implementation works through an interface, while most methods in both versions operate on `object`, which means value types can incur [`boxing` and `unboxing`](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/boxing-and-unboxing);
- does not support binding abstractions;
- offers limited control over the lifetime of created objects;
- uses LINQ. Yes, there is one LINQ method in here.

### DI as an implementation of IoC

Let us start with the terminology.

[Dependency Injection](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/overview) is fairly straightforward: it is a pattern that takes responsibility for supplying and resolving dependencies away from an object and hands it to a DI system. As the picture below shows, DI is not the only way to solve that problem.

![A diagram showing dependency management approaches](/assets/OwnDi/20251206120452.png)

`IoC`, or Inversion of Control, is a little more abstract. It is a principle of designing an architecture so that its modules are as isolated and loosely coupled as possible.

I also like to think of IoC as an approach that tells you: "Take this job away from your modules and hand it to these specialists over here." That leaves us with less tightly coupled code—which is where the "inversion" in the name comes from.

DI is a particular form of IoC. It takes the work of resolving internal dependencies away from the modules themselves.

That leaves the `IoC container`. An IoC container is a library or framework that provides the core DI machinery: it automates object creation and storage and manages object lifetimes.

It is also worth briefly mentioning the `Composition Root`: the hardworking part that creates dependency contracts and resolves them by creating objects, passing existing instances, and so on. In Zenject, installers play this role.

### How it works

Now let us look at the overall flow.

![A high-level DI flow diagram](/assets/OwnDi/20251206114641.png)

At a high level:

- in traditional OOP, an object has to satisfy its own dependencies, usually by receiving references through a constructor or an `Init()` method, or by creating new objects itself;
- Dependency Injection keeps dependency contracts in one place—the Composition Root, represented by the "Dependency Injection" box in the diagram. At application startup, and at runtime when necessary, that place comes to an object and supplies an instance of the required type.

I have already used the word "contract" several times, so what exactly do I mean by it?

![A dependency contract diagram](/assets/OwnDi/20251206114923.png)

A `contract` is a rule that defines:

- which requested type this contract applies to;
- which object should be returned for that type;
- what lifetime the returned object should have.

Those are only the essentials. A contract may additionally define how an object is created, which arguments it receives, which conditions have to be met, and so on.

To sum it up, when implementing Dependency Injection we:

1. Describe how each type should be resolved through contracts.
2. Call the methods that inject dependencies.
3. Let the framework find the relevant contract and return an object according to its rules.

>A DI framework usually has some syntactic convention that tells the application what should be resolved by the framework instead of manually—attributes or specially named methods, for example `[Inject]` in Zenject.

### Implementation

As I mentioned in the introduction, I made two versions. The first is not type-safe: through the root `object` type, we can bind practically anything, in any way, as many times as we want. The second is more type-safe: every binding must first be wrapped in an appropriate interface, and the binding queue is a dictionary whose values are lists of bindings for each type. That gives us somewhere to put the selection logic when a type has been bound more than once.

Let us start with the first version so the difference will be easier to see later.

`BindStorage`

This is where all our bound objects live.

```c#
public class BindStorage  
{  
    private List<object> _bindQueue = new();  
  
    public void Bind(object obj)  
    {        
        _bindQueue.Add(obj);  
    }  
    public bool TryGetBindedObject(Type targetType, out object result)  
    {        
        for (int i = 0; i < _bindQueue.Count; i++)  
        {            
            var currentObject =  _bindQueue[i];  
            var currentType = currentObject.GetType();  
  
            if (targetType.IsAssignableFrom(currentType))  
            {                
                result = currentObject;                
                return true;  
            }        
        }

        result = null;  
        return false;  
    }}
```

Nothing fancy here. We have a collection that receives objects through `Bind()`, plus `TryGetBindedObject()`, which returns the first object whose type matches the requested type.

`InjectStorage`

Its basic logic is similar to `BindStorage`, except there is nothing to search for.

```c#
public class InjectStorage  
{  
    private readonly List<object> _injectQueue = new();  
  
    public void Inject(object target)  
    {        
        if (!_injectQueue.Contains(target))  
            _injectQueue.Add(target);  
        else  
            Debug.LogError($"You are trying to inject the same object {target} more than once!");  
    }  
    
    public void ClearInjectQueue()  
    {       
	    _injectQueue.Clear();  
    }  
    public List<object> GetInjectQueue()  
    {        
	    return _injectQueue;  
    }
}
```

Before adding anything, we make sure the same object is not already queued for injection. `ClearInjectQueue()` and `GetInjectQueue()` clear and return that queue respectively.

`DInjector`

This is our IoC container. As I warned in the disclaimer, it does not provide complete lifetime management or storage for created objects. That could be addressed with a single collection and `IDisposable` implementations on both the objects and `DInjector`. If your resource-loading system is more involved, replace `Dispose()` with your own unloading method and call it when `DInjector` shuts down.

This module is fairly large, so let us take it apart.

```c#
public class DInjector  
{  
    private readonly BindStorage _bindStorage;  
    private readonly InjectStorage _injectStorage;  
  
    public DInjector(BindStorage bindStorage, InjectStorage injectStorage)  
    {   
        _bindStorage = bindStorage;  
        _injectStorage = injectStorage;  
    }  
    
    public void InjectAll()  
    {        
        var queue = _injectStorage.GetInjectQueue();  
  
        for (int i = queue.Count - 1; i >= 0; i--)  
        {            
	        Inject(queue[i]);  
        }    
    }
```

We pass in our injection and binding queues. `InjectAll()` iterates through every object in `InjectStorage` and calls `Inject()` for it.

```c#
private void Inject(object obj)  
{  
    if (MethodValidation(obj, obj.GetType()) == false)  
        Debug.Log(obj.GetType().Name + " no methods to inject");  
}  
  
private bool MethodValidation(object obj, Type targetType)  
{  
    int methodsToInject = 0;  
  
    foreach (var method in targetType.GetMethods())  
    {       
        if (method.GetCustomAttributes<DInjection>(true).Any())  
        {            
	        InjectMethod(obj, method);  
            methodsToInject++;        
        }    
    }  
    
    if (methodsToInject == 0)  
    {       
        Debug.Log($"No methods for injecting for {targetType.Name} in {obj} object");  
        return false;  
    }  
    return true;  
}
```

This is where things get interesting. `Inject()` calls `MethodValidation()`. We receive the object that needs its dependencies injected and the target type that must be inspected. Iterating through an entire object and every one of its members would be awkward, so this implementation only works through methods marked with the custom `DInjection` attribute. Using the reflection method `GetCustomAttributes`, we find every method carrying that attribute and pass it to the final `InjectMethod()`.

```c#
private void InjectMethod(object target, MethodInfo method)  
{  
    var parameters = method.GetParameters();  
  
    var resolvedArgs = new object[parameters.Length];  
  
    for (int i = 0; i < parameters.Length; i++)  
    {        
        var parameter = parameters[i];  
        var parameterType = parameter.ParameterType;  
  
        if (_bindStorage.TryGetBindedObject(parameterType, out var arg) == false)  
        {            
            WarningLog(parameterType, method, target);  
            return;  
        }  

        if (arg.GetType().GetCustomAttributes<AsTransientBind>().Any())  
        {            
            var newInstance = Activator.CreateInstance(parameterType);  
            MethodValidation(newInstance, newInstance.GetType());  
  
            resolvedArgs[i] = newInstance;            continue;  
        }  

        resolvedArgs[i] = arg;    
    }
      
    method.Invoke(target, resolvedArgs);  
}  
  
private void WarningLog(Type parameterType, MethodInfo method, object target)  
{  
    Debug.LogError($"Cannot inject parameter of type {parameterType} " +  
                   $"for method {method.Name} in class {target.GetType()}. " +  
                   "No binded object found.");  
}
```

We retrieve every parameter of the supplied method, look up each parameter type in `BindStorage` through `TryGetBindedObject()`, and write the result into `resolvedArgs`. That array is then passed to `method.Invoke(target, resolvedArgs)`.

The second check looks for the `AsTransientBind` attribute. It represents a different lifetime: every request for the bound type must return a new object. When the attribute is present, we create a new instance through `Activator.CreateInstance(parameterType)` and restart the chain for that object from `MethodValidation()`.

`DiContainer`

This is the container itself, which is really just a facade over the types described above.

```c#
public class DiContainer  
{  
    private readonly BindStorage _bindStorage;  
    private readonly InjectStorage _injectStorage;  
    private readonly DInjector _dInjector;  
  
    public DiContainer()  
    {        
        _bindStorage = new BindStorage();  
        _injectStorage = new InjectStorage();  
        _dInjector = new DInjector(_bindStorage, _injectStorage);  
    }  

    public void Bind(object target) => _bindStorage.Bind(target);  
  
    public void Inject(object target) => _injectStorage.Inject(target);  
  
    public void ClearInjectQueue() => _injectStorage.ClearInjectQueue();  

    public void InjectAll() => _dInjector.InjectAll();  
}
```

`DInjection` and `AsTransient`

These are the custom attributes we have already discussed.

```c#
[MeansImplicitUse(ImplicitUseKindFlags.Default)]  
[AttributeUsage(AttributeTargets.Method)]  
public class DInjection : Attribute  
{  
}

[MeansImplicitUse(ImplicitUseKindFlags.Default)]  
[AttributeUsage(AttributeTargets.Class)]  
public class AsTransientBind : Attribute  
{  
}
```

`GameInstaller`

Our Composition Root.

```c#
public class GameInstaller : MonoBehaviour  
{  
    [SerializeField] private  EntryPoint _entryPoint;  
    [SerializeField] private SecondEntryPoint _secondEntryPoint;  
  
    [SerializeField] private InstanceDummyScript _dummyPrefab;  
  
    private  DiContainer _diContainer;  
  
    public void Initialize(DiContainer container)  
    {        
        _diContainer = container;  
    }  

    public void InstallBindings()  
    {        
        BindPrefab(_dummyPrefab);  
        BindAsSingle(new SingleLogger());  
        BindAsTransient(new TransientLogger());  
  
        Inject(_entryPoint);  
        Inject(_secondEntryPoint);  
    } 

    private void Inject(object instance)  
    {        
        _diContainer.Inject(instance);  
    }

    private void BindPrefab(MonoBehaviour prefab)  
    {        
        _diContainer.Bind(prefab);  
    } 
     
    private void BindAsSingle(object instance)  
    {        
        _diContainer.Bind(instance);  
    }  

    private void BindAsTransient(object instance)  
    {        
        _diContainer.Bind(instance);  
    }
}
```

Although this happens to be a `MonoBehaviour`, it does not have to be one. This is where we create the bindings. It is the most primitive implementation imaginable: it really only needs one method, but I duplicated it so the intended API is visible. Every binding method—`BindPrefab`, `BindAsSingle`, and `BindAsTransient`—does the same thing: places an object into `BindStorage`.

`Inject()` exists so objects can be placed into the injection queue directly from the installer.

That covers the first version. It works, but I dislike both the duplicated code and the need to bind everything through `object`.

>To avoid making an already long article even longer, I am not including usage examples for this version here. They will live in a separate folder in the Git repository alongside the Unity project.

Now let us look at the second version—or, more precisely, what changed in it.

`IBindable`

```c#
public interface IBindable  
{  
    Type TargetType { get; }  
    object Resolve();  
}
```

Every object we want to bind is now wrapped behind a separate interface. It exposes only the wrapped object's type and a method that returns the object itself.

>A fair question here would be: "What is the point if the object resolves its own dependency and still returns `object`?" The second issue is easy enough to address by making the interface generic, although the refactor would not end there—every other method that uses `IBindable` would need to become generic too. As for the first issue, the method is part of the contract. Different implementations of the interface contain different logic for obtaining the object. Binding and finding the required object are still the responsibility of `BindStorage`, not the object itself.

`AsSingleBind<T>` and `AsTransientBind<T>`

```c#
public sealed class AsSingleBind<T> : IBindable where T : class  
{  
    private T _instance;  
  
    public Type TargetType => typeof(T);  
  
    public AsSingleBind(T instance) => _instance = instance;  
  
    public object Resolve() => _instance;  
}

public sealed class AsTransientBind<T> : IBindable where T : class  
{  
    public Type TargetType => typeof(T);  
  
    private DiContainer _diContainer;  
  
    private T _instance;  
    private bool _isMonoB;  
  
    public AsTransientBind(DiContainer diContainer)  
    {        
        _diContainer = diContainer;  
        _isMonoB = false;  
    }  

    public AsTransientBind(T prefab)  
    {        
        _instance = prefab;  
        _isMonoB = true;  
    }  

    public object Resolve()  
    {        
        if (_isMonoB)  
        {            
            return _instance;  
        }  
              
        return _instance = (T)_diContainer.FactoryMethod<T>();  
    }
}
```

`AsSingleBind` wraps objects whose lifetime resembles a singleton: one instance exists for the whole lifetime.

As in the previous version, `AsTransientBind` is for bindings that create a fresh instance on every request.

Their basic logic is the same:

- when creating a binding, we pass an instance to its constructor; that instance becomes the object returned by `Resolve()`;
- `AsTransientBind` has two constructors because I did not write a factory for `MonoBehaviour`s. One behaves as described above and is used for binding `MonoBehaviour`s. The other receives a `DiContainer` and calls its factory. Ideally I would avoid transient `MonoBehaviour`s entirely, but let us leave that as a possible extension point.

>This is also where the abstraction-binding limitation could be removed. Nothing stops us from creating something like `AsSingle<T, TImpl> where T : class where TImpl : T`. You may also notice that I limited bindings to classes. If you are not worried about boxing in `Resolve()`, feel free to remove the `where` constraint.

`GameInstaller`

The binding logic has changed.

```c#
public class GameInstaller : MonoBehaviour  
{  
    [SerializeField] private Bootstrap _bootstrap;  
    [SerializeField] private EntryPoint _entryPoint;  
    [SerializeField] private SecondEntryPoint _secondEntryPoint;  
  
    [SerializeField] private TransientSpawner1 _transientSpawner1;  
    [SerializeField] private TransientSpawner2 _transientSpawner2;  
  
    [SerializeField] private InstanceDummyScript _dummyPrefab;  
    [SerializeField] private InstanceTransientDummyScript _transientDummyPrefab;  
  
    private DiContainer _diContainer;  
  
    public void Initialize(DiContainer container)  
    {        
	    _diContainer = container;  
    }  
    
    public void InstallBindings()  
    {        
        AsSingleBind<InstanceDummyScript> dummyPrefab = new(_dummyPrefab);  
        _diContainer.Bind(dummyPrefab);  
  
        AsSingleBind<SingleLogger> logger = new(new SingleLogger());  
        _diContainer.Bind(logger);  
  
        AsTransientBind<TransientLogger> transientLogger =  
            new AsTransientBind<TransientLogger>(_diContainer);  
        _diContainer.Bind(transientLogger);  
  
        AsSingleBind<TransientSpawner1> transientSpawner1 = new AsSingleBind<TransientSpawner1>(_transientSpawner1);  
        AsSingleBind<TransientSpawner2> transientSpawner2 = new AsSingleBind<TransientSpawner2>(_transientSpawner2);  
        _diContainer.Bind(transientSpawner1);  
        _diContainer.Bind(transientSpawner2);  
  
        AsTransientBind<InstanceTransientDummyScript> transientDummyPrefab =  
            new AsTransientBind<InstanceTransientDummyScript>(_transientDummyPrefab);  
        _diContainer.Bind(transientDummyPrefab);  
  
        AsSingleBind<EntryPoint> entryPoint = new(_entryPoint);  
        AsSingleBind<SecondEntryPoint> secondEntryPoint = new(_secondEntryPoint);  
        _diContainer.Bind(entryPoint);  
        _diContainer.Bind(secondEntryPoint);  
  
        Inject(_bootstrap);  
        Inject(_entryPoint);  
        Inject(_secondEntryPoint);  
        Inject(_transientSpawner1);  
        Inject(_transientSpawner2);  
    }  
    
    private void Inject(object instance)  
    {        
        _diContainer.Inject(instance);  
    }
}
```

Every binding now starts by creating an object whose type implements `IBindable`, then passing it to `_diContainer.Bind()`. So how does the bound-object queue work now?

`BindStorage`

```c#
public class BindStorage  
{  
    Dictionary<string, List<IBindable>> _bindQueue = new(); 
     
    public void Bind(IBindable obj)  
    {         
        string key = obj.TargetType.ToString();  
  
        if (!_bindQueue.TryGetValue(key, out var list))  
        {            
	        list = new List<IBindable>();  
            _bindQueue[key] = list;  
        }                
        
        list.Add(obj);  
    }  
    
    public bool TryGetBindedObject(Type targetType, out object obj)  
    {        
        if (_bindQueue.TryGetValue(targetType.ToString(), out var list) && list.Count != 0)  
        {            
            obj = list[0].Resolve();  
            return true;  
        }  
        
        obj = null;  
        return false;  
    }
}
```

There are two key differences:

- the binding collection now holds `IBindable` objects instead of `object`. It is also a dictionary rather than a list; each key is the type converted to a string, and each value is a list of `IBindable`s;
- when `TryGetBindedObject()` resolves an object by type, it takes the first item from the list stored under the matching dictionary key. Even if the same type has been bound several times, the first binding wins.

`InjectStorage` stays the same.

```c#
public class InjectStorage  
{  
    private readonly List<object> _injectQueue = new();  
  
    public void Inject(object target)  
    {        
        if (!_injectQueue.Contains(target))  
        {
            _injectQueue.Add(target);
        }
        else  
        {
            Debug.LogError($"You are trying to inject the same object {target} more than once!");  
        }
    }  
    
    public void ClearInjectQueue()  
    {        
        _injectQueue.Clear();  
    }  
    
    public List<object> GetInjectQueue()  
    {        
        return _injectQueue;  
    }
}
```

`DInjector`

```c#
public class DInjector  
{  
    private readonly BindStorage _bindStorage;  
    private readonly InjectStorage _injectStorage;  
  
    public DInjector(BindStorage bindStorage, InjectStorage injectStorage)  
    {        
        _bindStorage = bindStorage;  
        _injectStorage = injectStorage;  
    }  
    
    public void InjectAll()  
    {        
        var queue = _injectStorage.GetInjectQueue();  
  
        for (int i = queue.Count - 1; i >= 0; i--)  
        {            
            CheckResolve(queue[i]);  
        }    
    } 
     
    private void CheckResolve(object obj)  
    {        
        if (Resolve(obj, obj.GetType()) == false)  
            Debug.Log(obj.GetType().Name + " no methods to inject");  
    }  
    
    private bool Resolve(object obj, Type targetType)  
    {        
        int methodsToInject = 0;  
  
        foreach (var method in targetType.GetMethods())  
        {            
            if (method.GetCustomAttributes<DInjection>(true).Any())  
            {                
                ResolveMethod(obj, method);  
                methodsToInject++;            
            }       
        }  
        if (methodsToInject == 0)  
        {            
            Debug.Log($"No methods for injecting for {targetType.Name} in {obj} object");  
            return false;  
        }  
        
        return true;  
    }  
    
    private void ResolveMethod(object target, MethodInfo method)  
    {        
        var parameters = method.GetParameters();  
  
        var resolvedArgs = new object[parameters.Length];  
  
        for (int i = 0; i < parameters.Length; i++)  
        {            
            var parameterType = parameters[i].ParameterType;  
  
            if (_bindStorage.TryGetBindedObject(parameterType, out var arg) == false)  
            {                
                WarningLog(parameterType, method, target);  
                return;  
            } 
             
            if (arg.GetType().GetCustomAttributes<AsTransient>(true).Any())  
            {                
                Resolve(arg, arg.GetType());  
            }  
            
            resolvedArgs[i] = arg;        
        }  
        
        method.Invoke(target, resolvedArgs);  
    }  
    
    private void WarningLog(Type parameterType, MethodInfo method, object target)  
    {        
        Debug.LogError($"Cannot inject parameter of type {parameterType} " +  
                       $"for method {method.Name} in class {target.GetType()}. " + 
                       "No binded object found.");  
    }
}
```

I renamed the main methods, but the flow is otherwise the same:

- we receive the queue of bound objects and the injection queue;
- `InjectAll()`, called through `DiContainer` and in turn through the bootstrap, iterates over every object in `InjectStorage` and calls `CheckResolve()`;
- `Resolve()` receives an object and its target type, then collects every method marked with `[DInjection]`;
- `ResolveMethod()` retrieves the method parameters and tries to resolve them through `BindStorage`. If a parameter has the `AsTransient` attribute, it goes back through the chain from `Resolve()` so its own dependencies can be resolved;
- finally, the method is invoked with the resolved parameters.

And last but not least, our `DiContainer`:

```c#
public class DiContainer  
{  
    private readonly BindStorage _bindStorage;  
    private readonly InjectStorage _injectStorage;  
    private readonly DInjector _dInjector;  
  
    public DiContainer()  
    {        
        _bindStorage = new BindStorage();  
        _injectStorage = new InjectStorage();  
        _dInjector = new DInjector(_bindStorage, _injectStorage);  
    }  
    
    public void Bind(IBindable target) => _bindStorage.Bind(target);  
  
    public void Inject(object target) => _injectStorage.Inject(target);  
  
    public void ClearInjectQueue() => _injectStorage.ClearInjectQueue(); 
     
    public void InjectAll() => _dInjector.InjectAll();  
  
    public object FactoryMethod<T>()  
    {        
        var result = Activator.CreateInstance(typeof(T));  
        return result;  
    }
}
```

The main changes are:

- `Bind()` now accepts `IBindable`;
- `FactoryMethod<T>()` was added to create transient objects.

>The single-instance creation logic could also be moved here.

### Conclusion

I want to stress once more that both systems have the drawbacks listed at the beginning of the article. Still, both versions do their job perfectly well: they inject dependencies into selected types.

All of the code and the example scene will be available in my Git repository.

I would be happy to hear any feedback—both on the content, since this is my first attempt at writing a technical article, and on the DI implementation itself.

Thanks for reading all the way to the end.
