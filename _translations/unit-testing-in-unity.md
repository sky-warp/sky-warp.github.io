---
title: Unit Testing in Unity
date: 2026-08-27
lang: en
translation_key: unity-unit-testing
description: Why tests matter when working with AI, how Unity Test Framework and NUnit fit together, and how to test jumping, crouching, and dashing in Play Mode.
---

# Why this matters

To be honest, when I was starting out, I was not particularly interested in unit testing—or testing in general. Sure, having a CI/CD pipeline packed with tests sounds nice: after changing the code and making a new build, you immediately see what broke and where. But writing tests on top of features felt like a lot of overhead. On most casual projects I worked on, and still work on, Play Mode testing was enough to tell whether everything behaved as expected. By "testing" here, I mean launching the game and manually poking the new buttons.

Then AI arrived, and everything changed.

If you want my honest opinion, not using AI in modern development is stupid. But using AI in modern development without fencing that AI in with tests is twice as stupid.

I have been using agents in development for almost a year, and only recently made myself a rule: whenever I start working with a new agent or model, I always give it the same condition. If it adds code or changes the codebase, it must add new tests or update the existing ones. In Unity, unless told otherwise—or unless the feature clearly requires `yield` syntax—AI usually reaches for NUnit's standard API on its own.

The value of tests is easiest to see in an AI-assisted workflow. It often looks like this:

- you tell the model what you want and ask it for an implementation plan;
- you validate the plan, approve it, or request changes;
- you inspect the final result;
- you may get lucky—you are a prompt-engineering genius, naturally—and the model delivers everything perfectly;
- or you may not get lucky, and you start iterating with the model, hoping that *this* time it will finally understand you.

If you add tests after validating the plan but before reviewing the final result, you are effectively telling the model: "If your solution does not pass these tests, redo it." That forces the model to iterate without your direct involvement.

I think this is the only sensible way to use AI in development and actually save time.

Of course, you should be wary of cases where the model writes the feature first and then writes tests that conveniently fit its own implementation. It is better to spend some time defining the expected behavior in tests up front than to argue later with a model that is clearly gaslighting you.

Let us also spell out the main benefits and costs of testing in any project, not only games. Testing takes real effort, so the decision to adopt it should be made carefully.

Benefits:

- faster bug detection and, as a result, fewer bugs;
- a test is documentation. When you integrate a third-party library or add a feature, tests give you concrete conditions and rules that the rest of the code must continue to satisfy. You can be sure the library or feature has not broken anything, and the same applies to refactoring: afterward, you can verify that every affected module still behaves according to its tests;
- cleaner code. I am not suggesting that you remove useful runtime checks such as null checks, but many behavioral guarantees can be moved into tests.

Costs:

- maintaining the system. Once you adopt testing, every new piece of code needs appropriate tests, and that requires discipline. Tests also take time not only to create, but to keep up to date;
- false confidence. Tests describe the cases you thought to write down, but you cannot always predict every situation the application will encounter in the real world.

There is also a whole development methodology built around tests: TDD, or Test-Driven Development. The idea is to write tests that describe the application's behavior first, then implement the code that makes them pass.

One last reminder: testing can be unnecessary overhead for some projects, especially small ones.

If you are still interested in what unit tests are and how to write them in Unity, let us begin with the definitions.

# What is a unit test?

A `unit test` tests one unit of code—a feature, method, and so on. It checks a small piece of logic in a particular scenario under defined conditions. In other words, it verifies that the logic behaves the way we intended.

>A unit test executes a piece of logic deliberately and checks its result.

The main value of such a test is the ability to verify that a module still works after either that module or one of its dependencies changes.

# Unit test suites

A unit test suite is a class or group containing the tests that belong to the same logical area.

If even one test fails, the suite as a whole is not considered successful.

![An illustration of a unit test suite](/assets/UnitTests/20260703012907.png)

*Thanks to [PatientZero](https://habr.com/ru/users/PatientZero/) for such a simple and useful illustration, and for the excellent article on unit testing it came from.*

# Unity Test Framework (UTF)

[Unity Test Framework](https://docs.unity3d.com/Packages/com.unity.test-framework@2.0/manual/index.html) is Unity's package for writing and running tests. It integrates and extends NUnit for .NET. Its Unity-specific additions let tests interact with engine concepts such as yielding frames and triggering domain reloads.

It is also important to note that a module can only be tested cleanly when it is isolated into its own assembly definition file. A test assembly needs a reference to `nunit.framework.dll`, and it must reference the assembly definition containing the code under test. We will see an example below.

In practice, UTF is the umbrella name for Unity's testing toolset. The workhorse you interact with in the Editor is the Unity Test Runner.

# Unity Test Runner

_Window ▸ General ▸ Test Runner_.

![The Unity Test Runner window](/assets/UnitTests/20260703034619.png)

`Unity Test Runner` is the tool that runs selected tests and displays their results.

![A test assembly in the Unity Test Runner](/assets/UnitTests/20260703034639.png)

*This is an assembly from the Zenject package, which includes a test DLL out of the box. We can inspect and run those tests in the Test Runner as well.*

The window shows tests for the available modes and the result of each run.

Broadly, Unity separates tests into Edit Mode tests and Play Mode tests.

Before discussing them separately, let us note what they have in common:

- tests live in a test assembly with a reference to `nunit.framework.dll`;

![A reference to nunit.framework.dll](/assets/UnitTests/20260804072838.png)

- the assembly definition specifies the target platform or platforms. An Editor-only test assembly targets `Editor`.

![An Editor-only test assembly definition](/assets/UnitTests/20260718135347.png)

>A test assembly definition cannot reference Unity's predefined `Assembly-CSharp.dll` directly. The code under test should be moved into its own assembly definition, which the test assembly can reference.

## Play Mode tests

Play Mode tests let us exercise game code at runtime, using a coroutine and the appropriate attribute when needed. According to Unity's [official Play Mode requirements](https://docs.unity3d.com/Packages/com.unity.test-framework@2.0/manual/edit-mode-vs-play-mode-tests.html):

- the test assembly references `nunit.framework.dll`;
- the test scripts are located under the folder containing the `.asmdef` file;
- the test assembly references another assembly definition containing the code under test.

## Edit Mode tests

Edit Mode tests run only in the Editor and can access Editor lifecycle code as well as the `UnityEngine` and `UnityEditor` namespaces.

When they yield, they advance through the `EditorApplication.update` callback loop rather than through a Play Mode coroutine. Otherwise, the assembly setup is similar to Play Mode tests.

>`EditorApplication.update` is not tied to the Play Mode `Update` loop. It runs on Editor ticks, whose timing varies with the current conditions. The Editor generally uses the `ApplicationIdleTime` value stored in `EditorPrefs` as the interval between idle ticks; its default is four seconds. Background execution, dragging, and other operations may affect that cadence.

This article focuses on Play Mode tests. You are more likely to reach for Edit Mode tests when checking an asset postprocessor, a custom Editor utility, or similar tooling, although they can certainly be useful for game logic too.

## UnityTest vs Test

An attribute is the main marker that tells the framework a particular method is a test. Here we will use the two most common options: NUnit and Unity Test Framework.

Unity's own recommendation is to use NUnit's `[Test]` instead of `[UnityTest]` whenever you do not need to:

- yield instructions from an Edit Mode test;
- yield frames, seconds, or engine events from a Play Mode test.

>Perhaps I should have said this earlier: Unity does not force you to write tests through its own layer over NUnit. You can use only the NUnit API, and it works just fine. When you need to control features inside the engine lifecycle, use Unity's syntax and UTF. The [UnityTest documentation](https://docs.unity3d.com/Packages/com.unity.test-framework@2.0/api/UnityEngine.TestTools.UnityTestAttribute.html) covers the difference in more detail.

# A quick recap

At this point we know that:

- tests are great, especially when working with AI;
- every test is a deliberately executed method or group of methods;
- a test has explicit conditions that determine whether it passes or fails;
- Unity uses NUnit as its foundation and adds Unity-specific features through UTF. You can use one, the other, or happily mix both;
- in Unity and C#, attributes mark the relevant methods as tests.

Now that the groundwork is out of the way, let us write one ourselves.

# Writing our first test

As we have established, a test is a method inside a class, marked with a special attribute. The Test Runner discovers test methods in test assemblies and executes them.

Unity can quickly create a test folder and assembly through the Project window's context menu.

![Creating a test folder in Unity](/assets/UnitTests/20260804090459.png)

Unity adds the required references automatically.

![A newly created test assembly](/assets/UnitTests/20260804090640.png)

>This separation lets both Unity and us, as developers, keep production code apart from test code.

For the test assembly to access the game's types, we create an assembly definition in the folder containing the code we want to test, then add a reference to it from the test assembly definition.

In this article, we will test a custom character controller with double jumping, crouching, and dashing. Those are the features our tests need to cover. To avoid pasting hundreds of lines, I will include only the methods and values relevant to the tests.

The test fixture starts like this:

```c#
    public sealed class CharacterControllerTest  
    {  
        private const float SpawnY = 1f;  
        private const float FallingVelocityBeforeSecondJump = -3f;  
  
        private GameObject _ground;  
        private GameObject _player;
          
        private Rigidbody2D _body;  
        private CharacterConfig _config;  
        private CharacterInputFake _input;
```

The class itself is not a test, so it does not need a test attribute.

## A few words about DI in tests

>Zenject, for example, provides test wrappers that make it easier to create tests around dependency injection. I will cover only the basics of unit testing here, although the framework can do more.
>
>I am also deliberately skipping its extra attributes and types. In my opinion, they make unit tests harder to follow by creating extra contexts and containers behind the scenes. It is often simpler to create a container directly inside the test and bind or resolve whatever you need.
>
>For integration tests—tests of whole systems, where modules interact both internally and externally—Zenject does provide some genuinely useful tools.
>
>![Zenject testing helpers](/assets/UnitTests/20260827132916.png)
>
>If you want the details, see the project's official guide to [writing automated tests with Zenject](https://github.com/modesttree/Zenject/blob/master/Documentation/WritingAutomatedTests.md). This article discusses Zenject only; for any other DI framework, check that project's official documentation.

DI setup inside a test is actually simple: create a container, and you are ready to go. You do not need to register the test itself in an installer or an equivalent construct.

Dependencies can be obtained through the container's `Resolve()` method or through the `[Inject]` attribute.

```c#
[UnitySetUp]  
public IEnumerator UnitySetUp()  
{  
    _config = ScriptableObject.CreateInstance<CharacterConfig>();  
    _input = new CharacterInputFake();  
  
    DiContainer container = new DiContainer();  
  
    container.Bind<ICharacterInput>().FromInstance(_input);  
    container.BindInstance(_config);  
  
    _ground = CreateGround();  
    _player = CreatePlayer();  
    _body = _player.GetComponent<Rigidbody2D>();  
    _collider = _player.GetComponent<CapsuleCollider2D>();  
  
    container.InstantiateComponent<PlayerCharacterController>(_player);  
    _player.SetActive(true);  
  
    yield return null;  
}
```

>`[SetUp]` and its UTF counterpart `[UnitySetUp]` add initialization logic that runs before each test. The setup method is not considered a test itself. `[UnitySetUp]` returns `IEnumerator`, so it can yield Unity instructions.

As you can see, the container is created successfully.

![The DI container created during setup](/assets/UnitTests/20260842109145.png)

Back to the test itself.

We have already seen the setup method and its attribute. Here we follow the rule mentioned above: when we do not need `yield` syntax, we use NUnit's attribute.

```c#
[SetUp]  
public void SetUp()  
{  
    _config = ScriptableObject.CreateInstance<CharacterConfig>();  
    _input = new CharacterInputFake();  
  
    DiContainer container = new DiContainer();  
        container.Bind<ICharacterInput>().FromInstance(_input);  
    container.BindInstance(_config);  
  
    _ground = CreateGround();  
    _player = CreatePlayer();  
    _body = _player.GetComponent<Rigidbody2D>();  
  
    container.InstantiateComponent<PlayerCharacterController>(_player);  
    _player.SetActive(true);  
}
```

A little context on the types and helpers above:

- `CharacterConfig` is a regular `ScriptableObject` containing the character-movement settings: jump velocity, the window between repeated A/D presses for a dash, the crouch speed multiplier, and so on;
- `CharacterInputFake` is a fake input module created for the test. It mimics the real input controller and implements the fairly small `ICharacterInput` interface.

```c#
public interface ICharacterInput  
{  
    event Action JumpPressed;  
    event Action<int> DashRequested;  
    event Action<bool> CrouchChanged;  
  
    float Horizontal { get; }  
    bool CrouchHeld { get; }  
  
    void Initialize();  
}
```

- `CreateGround()` creates a collider surface on which the character spawns.

```c#
private static GameObject CreateGround()  
{  
    GameObject ground = new GameObject("Test Ground");  
    ground.transform.position = new Vector2(0f, -0.5f);  
    ground.AddComponent<BoxCollider2D>().size = new Vector2(10f, 1f);  
    return ground;  
}
```

- `CreatePlayer()` creates the test character `GameObject` with a Rigidbody and capsule collider.

```c#
private static GameObject CreatePlayer()  
{  
    GameObject player = new GameObject("Test Player");  
    player.transform.position = new Vector2(0f, SpawnY);  
    player.SetActive(false);  
  
    Rigidbody2D body = player.AddComponent<Rigidbody2D>();  
    body.gravityScale = 0f;  
    body.freezeRotation = true;  
  
    CapsuleCollider2D collider = player.AddComponent<CapsuleCollider2D>();  
    collider.size = new Vector2(1f, 2f);  
  
    return player;  
}
```

- `PlayerCharacterController` is the component that actually moves the character `GameObject` around the scene;
- `_collider` is the character object's collider.

The first test in the suite covers jumping. Specifically, it verifies that the jump works and gives the character the Y-axis velocity configured in `CharacterConfig`.

```c#
[UnityTest]  
public IEnumerator OneJump_AppliesConfiguredJumpVelocity()  
{  
    yield return PressJump();  
  
    AssertJumpVelocity();  
}
```

`PressJump()` simulates pressing the space bar through our fake input controller.

```c#
private IEnumerator PressJump()  
{  
    _input.PressJump();  
    yield return new WaitForFixedUpdate();  
}
```

The input controller simply raises the corresponding event.

```c#
public void PressJump()  
{  
    JumpPressed?.Invoke();  
}
```

Now we need to express the condition that makes the test pass—and, when it is not met, fail.

```c#
private void AssertJumpVelocity()  
{  
    Assert.That(  
        _body.linearVelocity.y,  
        Is.EqualTo(_config.JumpVelocity).Within(0.001f));  
}
```

Meet NUnit's `Assert` class. Its API determines the final result of the test. Assertions are central to NUnit: they check whether a supplied condition holds. NUnit's official [assertion documentation](https://docs.nunit.org/articles/nunit/writing-tests/assertions/assertions.html) is the best place to see the full API.

In NUnit 3.0 and later, assertions are primarily written with `Assert.That()` and the [Constraint Model](https://docs.nunit.org/articles/nunit/writing-tests/assertions/assertion-models/constraint.html). For example:

```csharp
Assert.That(myString, Is.EqualTo("Hello"));
```

The first argument is the actual value. The second uses NUnit's syntax helpers to create a constraint—an object that contains the logic for checking the condition. The example above creates an `EqualConstraint`. The point is to encapsulate each kind of check in the constraint passed as the second argument. The complete list is available in NUnit's [constraint reference](https://docs.nunit.org/articles/nunit/writing-tests/constraints/Constraints.html).

Older versions commonly used a separate method for each assertion, such as `Assert.AreEqual`. That Classic Model is still supported, but the Constraint Model is NUnit's primary modern API.

>Do not confuse NUnit's `Assert` class with `UnityEngine.Assertions.Assert`. Both apply the concept of an assertion: you pass a statement to a method, which determines whether it is true. If it is false, control does not return normally and an error is reported. In a test with several sequential assertions, any assertions after the first failure are not executed.

Now that we know what `Assert.That()` does, look at our check once more:

```c#
Assert.That(  
        _body.linearVelocity.y,  
        Is.EqualTo(_config.JumpVelocity).Within(0.001f));  
```

As you have probably guessed, we check that the Rigidbody's velocity matches the configured value within a tolerance of `0.001`.

Let us run our first test.

![The jump test in Test Runner](/assets/UnitTests/20260884022184.png)

It now appears under the appropriate DLL in the Test Runner. Double-click a test or test group in the hierarchy to run it. To run every test in the project, use `Run All` in the lower-right corner.

![A successful jump test](/assets/UnitTests/20260817482903.png)

The test passes.

For reference, here is the character configuration. The jump velocity is `10`, so the character receives the same—or sufficiently close—velocity in the test, within our `0.001` tolerance.

![The character movement configuration](/assets/UnitTests/20260810492039.png)

Next, let us test the double jump.

```c#
[UnityTest]  
public IEnumerator DoubleJump_AppliesSecondAirborneJumpVelocity()  
{  
    yield return PressJump();  
  
    AssertJumpVelocity();  
  
    _ground.SetActive(false);  
    _body.linearVelocity = new Vector2(0f, FallingVelocityBeforeSecondJump);  
  
    yield return PressJump();  
  
    AssertJumpVelocity();  
}
```

As in the previous test, we verify the first jump. Then we disable the ground under the character, simulate a second jump, and check again that the Y velocity matches the configured value.

The next test in the suite covers crouching. A sensible way to test this feature is to verify that the character can pass under an obstacle while crouched.

```c#
[UnityTest]  
public IEnumerator Crouch_FitsUnderObstacleAndCannotStandIntoIt()  
{  
    float standingHeight = _collider.size.y;  
    float crouchedHeight = standingHeight * _config.CrouchHeightRatio;  
    
    _ceiling = CreateLowCeiling(standingHeight, crouchedHeight);  
    Collider2D ceilingCollider = _ceiling.GetComponent<Collider2D>();  
  
    _input.SetCrouchHeld(true);  
    yield return new WaitForFixedUpdate();  
  
    Assert.That(  
        _collider.size.y,  
        Is.EqualTo(crouchedHeight).Within(0.001f));  
        
    Assert.That(  
        Physics2D.Distance(_collider, ceilingCollider).isOverlapped,  
        Is.False,  
        "The crouched collider should fit below the obstacle.");  
  
    _input.SetCrouchHeld(false);  
    yield return new WaitForFixedUpdate();  
  
    Assert.That(  
        _collider.size.y,  
        Is.EqualTo(crouchedHeight).Within(0.001f),  
        "The controller should remain crouched while standing is obstructed.");  
}
```

Let us break it down:

- first, we calculate the collider's standing and crouched heights;
- then we call `CreateLowCeiling()`:

```c#
private GameObject CreateLowCeiling(  
    float standingHeight,  
    float crouchedHeight)  
{  
    float removedHeight = standingHeight - crouchedHeight;  
    
    float standingTop =  
        _player.transform.position.y +  
        _collider.offset.y +  
        standingHeight * 0.5f; 
         
    float ceilingHeight = removedHeight * 0.5f;  
  
    GameObject ceiling = new GameObject("Test Low Ceiling");
      
    ceiling.transform.position = new Vector2(  
        _player.transform.position.x,  
        standingTop - removedHeight * 0.5f);  
    ceiling.AddComponent<BoxCollider2D>().size = new Vector2(  
        2f,  
        ceilingHeight);    
        
        return ceiling;  
}
```

This helper calculates the obstacle's height—a ceiling in our case—and places it over the character. The character can fit underneath only while crouching.

Crouching itself changes the collider size and the movement-speed multiplier. `_input.SetCrouchHeld(true)` raises the corresponding event and invokes the handler in the character controller.

```c#
private void SetCrouched(bool crouched)  
{  
    if (_isCrouched == crouched)  
    {        return;  
    }  
    _isCrouched = crouched;  
  
    if (!crouched)  
    {        _collider.size = _standingColliderSize;  
        _collider.offset = _standingColliderOffset;  
        return;  
    }  
    float crouchedHeight =  
        _standingColliderSize.y * _config.CrouchHeightRatio;  
    float removedHeight = _standingColliderSize.y - crouchedHeight;  
  
    _collider.size = new Vector2(  
        _standingColliderSize.x,  
        crouchedHeight);    _collider.offset =  
        _standingColliderOffset +  
        Vector2.down * (removedHeight * 0.5f);  
}
```

The controller also checks the crouching flag and adjusts horizontal speed accordingly.

```c#
float speedMultiplier = _isCrouched  
    ? _config.CrouchSpeedMultiplier  
    : 1f;  
  
horizontalVelocity =  
    _input.Horizontal *  
    _config.MovementSpeed *  
    speedMultiplier;
```

The test then makes two assertions:

```c#
Assert.That(  
        _collider.size.y,  
        Is.EqualTo(crouchedHeight).Within(0.001f));  
        
    Assert.That(  
        Physics2D.Distance(_collider, ceilingCollider).isOverlapped,  
        Is.False,  
        "The crouched collider should fit below the obstacle.");  
```

The first uses the now-familiar `Is.EqualTo()`. Within a tolerance of `0.001`, it checks that the collider height equals its original height multiplied by `CrouchHeightRatio`. In our configuration that ratio is `0.55`, so crouching makes the collider almost twice as short.

`Is.False` creates a `FalseConstraint`, which checks that an expression is false. If it is true, the assertion reports the message supplied as the final argument. Here, `Physics2D.Distance()` returns a `ColliderDistance2D`, and we assert that the character and ceiling colliders do not overlap.

```c#
public bool isOverlapped => (double) this.m_Distance < 0.0;
```

This is the relevant property on `ColliderDistance2D`. The [official Unity description](https://docs.unity3d.com/ScriptReference/ColliderDistance2D.html) defines a zero distance as touching, a positive distance as separation, and a negative distance as overlap.

We can extend the test to check that the character stays crouched when an obstacle prevents standing. Set the fake input flag to `false`, then verify that the player collider remains at the crouched height.

```c#
_input.SetCrouchHeld(false);  
    yield return new WaitForFixedUpdate();  
  
    Assert.That(  
        _collider.size.y,  
        Is.EqualTo(crouchedHeight).Within(0.001f),  
        "The controller should remain crouched while standing is obstructed."); 
```

Once written, this test also appears in the Test Runner.

![The crouch test in Test Runner](/assets/UnitTests/20260817482930.png)

Let us run it.

![Successful crouch tests](/assets/UnitTests/202608238374195.png)

All tests pass.

The final test in the suite covers dashing.

```c#
[UnityTest]  
public IEnumerator Dash_CanRepeatOnlyAfterCooldown()  
{  
    _input.RequestDash(1);  
    yield return new WaitForFixedUpdate();  
  
    AssertHorizontalVelocity(_config.DashSpeed);  
    float firstDashStartedAt = Time.fixedTime;  
  
    while (Time.fixedTime < firstDashStartedAt + _config.DashDuration)  
    {        
      yield return new WaitForFixedUpdate();  
    }  
    AssertHorizontalVelocity(0f);  
    Assert.That(  
        Time.fixedTime,  
        Is.LessThan(firstDashStartedAt + _config.DashCooldown),  
        "The test requires the dash duration to be shorter than its cooldown.");  
  
    _input.RequestDash(-1);  
    yield return new WaitForFixedUpdate();  
  
    AssertHorizontalVelocity(0f);  
  
    while (Time.fixedTime < firstDashStartedAt + _config.DashCooldown)  
    {        
      yield return new WaitForFixedUpdate();  
    }  
    
    _input.RequestDash(-1);  
    yield return new WaitForFixedUpdate();  
  
    AssertHorizontalVelocity(-_config.DashSpeed);  
}
```

`_input.RequestDash(1)` receives the requested direction: `-1` means left, `1` means right, and `0` causes the method to do nothing. `RequestDash()` raises the relevant event, and the character controller handles it like this:

```c#
  
private void TryStartDash()  
{  
    if (_queuedDashDirection == 0)  
    {   
    return;  
    }  
    
    int requestedDirection = _queuedDashDirection;  
    _queuedDashDirection = 0;  
  
    if (Time.fixedTime < _nextDashTime)  
    {        
      return;  
    }  
    _activeDashDirection = requestedDirection;  
    _dashEndTime = Time.fixedTime + _config.DashDuration;  
    _nextDashTime = Time.fixedTime + _config.DashCooldown;  
}
```

The controller calculates when the player may dash again. It uses [`Time.fixedTime`](https://docs.unity3d.com/ScriptReference/Time-fixedTime.html), Unity's time at the start of the most recent `FixedUpdate`, measured from the beginning of the game.

I extracted the character's horizontal-velocity check into a helper:

```c# 
private void AssertHorizontalVelocity(float expectedVelocity)  
{  
    Assert.That(  
        _body.linearVelocity.x,  
        Is.EqualTo(expectedVelocity).Within(0.001f));  
}
```

Next we wait for the dash to finish and verify that the character's velocity is zero—the character has stopped completely.

```c#
AssertHorizontalVelocity(0f);
```

The next assertion is:

```c#
Assert.That(  
    Time.fixedTime,  
    Is.LessThan(firstDashStartedAt + _config.DashCooldown),  
    "The test requires the dash duration to be shorter than its cooldown.");
    
  
_input.RequestDash(-1);  
yield return new WaitForFixedUpdate();  
  
AssertHorizontalVelocity(0f);
```

`Is.LessThan()` creates a `LessThanConstraint`, which checks whether the first value is smaller than the second. Here we first confirm that the cooldown has not finished, then try to dash in the opposite direction. `AssertHorizontalVelocity(0f)` immediately verifies that the character did not move.

Finally, we wait for the cooldown to expire, request another dash to the left, and check that the horizontal velocity matches the configured value.

```c#
while (Time.fixedTime < firstDashStartedAt + _config.DashCooldown)  
{  
    yield return new WaitForFixedUpdate();  
}  
  
_input.RequestDash(-1);  
yield return new WaitForFixedUpdate();  
  
AssertHorizontalVelocity(-_config.DashSpeed);
```

That is it. We now have a test suite covering the character's special movement abilities.

![The complete character-controller test suite](/assets/UnitTests/202608193847282.png)

The suite passes.

![A successful test-suite run](/assets/UnitTests/20260818374911.png)

Finally, just as `[SetUp]` and `[UnitySetUp]` prepare a test, `[TearDown]` and `[UnityTearDown]` can clean up after each test. Unity's version can yield instructions and therefore returns `IEnumerator`.

```c#
[UnityTearDown]
public IEnumerator UnityTearDown()
{
  if (_config != null)
  {
      UnityEngine.Object.Destroy(_config);
      _config = null;
  }

  if (_player != null)
  {
      UnityEngine.Object.Destroy(_player);
      _player = null;
  }

  if (_ground != null)
  {
      UnityEngine.Object.Destroy(_ground);
      _ground = null;
  }

  if (_ceiling != null)
  {
      UnityEngine.Object.Destroy(_ceiling);
      _ceiling = null;
  }

  yield return null;
}
```

`[UnityTearDown]` could safely be replaced with `[TearDown]` if no yielded Unity instruction were needed, but leaving the Unity version here makes the symmetry clear.

# Conclusion

I hope I managed to show the testing process from several angles. Testing really is useful and can save a lot of time, but maintaining and debugging a test suite also consumes resources. Do not treat it as mandatory for every new project unless, of course, you are planning to work with TDD.

My goal here was simply to demonstrate the basics of writing unit tests and—primarily for myself—to reinforce what I had learned. If you want to go deeper, the best resources I can recommend are the [Unity Test Framework documentation](https://docs.unity3d.com/Packages/com.unity.test-framework@2.0/manual/index.html) and the [NUnit documentation](https://docs.nunit.org/). Remember to select the documentation version that matches your installed Unity package.
