---
title: Unit тесты. Тестирование в Unity
---

# Почему это важно 

Если честно, в начале своего пути я не сильно интересовался юнит тестированием, как и тестированием в целом. Да, вроде классно когда есть какой-нибудь CI\CD пайплайн с кучей тестов, при котором ты сразу можешь понять что и где отвалилось при сборке нового билда после внесения изменений в код, но писать их поверх фич было большим оверхедом, т.к. на большинстве казуальных проектов (над которыми я работал и работаю), достаточно тестов в Play Mode, чтобы понять, что все работает как надо (здесь под тестами я понимаю просто зайти в игру и потыкать ручками в новые кнопки) Однако все изменилось с приходом ИИ.

Если вам так интересно мое мнение: не пользоваться ИИ в современной разработке - глупо. Но также стоит добавить: использовать ИИ в современной разработке и не ограничивать работу этого самого ИИ тестами - глупо в двойне. 

Я пользуюсь агентами в разработке уже почти год, и только недавно завел себе правило - в начале работы с новым агентом или новой моделью, я ставлю всегда одно и тоже условие: при добавлении или изменении кодовой базы проекта - пиши или обновляй существующие тесты (В рамках Unity, как правило, ИИ автоматом выбирает стандартный API NUnit библиотеки, если не указано иное, либо если в фиче явно нужен yield синтаксис).

Наглядно польза от тестов легко прослеживается через ваш flow с ИИ. 
Зачастую это выглядит так:
- вы говорите нейронке что вы хотите и просите составить план реализации
- валидируете план и либо апруваете либо вносите изменения 
- смотрите финальный результат 
- вам может повезти (вы гений промпт-инжениринга) и нейросеть справится с поставленной задачей на все 100 процентов 
- вам может не повести (вы не гений промпт-инжениринга) и вы начинаете итерировать с нейронкой в надежде что вот сейчас она то вас точно поймет

Если вы добавите тесты после валидации и перед просмортром финального результата - вы по сути говорите нейронке: "Если твое решение не проходит тесты - переделывай", что заставляет нейронку итерировать без вашего участия.

Мне кажется это единственный верный способ, как использовать ИИ в разработке и действительно экономить во времени.

Стоит конечно опасаться ситуаций, когда нейронка сначала пишет фичу, а потом пишет тесты, очевидно подгоняя их под свою реализацию. Лучше потратьте сначала время на написание тестов, в которых будет прописано как должна работать та или иная фича, чем потом убеждать нейронку, что она вас газлайтит.

Давайте также обозначим основные преимущества и недостатки тестирования в любых проектах (не только играх), т.к. сам по себе процесс достаточно трудозатратный и решение о внедрении тестирования должно приниматься осторожно.

Преимущества:
- быстрый детект багов и как следствие меньшее их количество
- тест = документ. При внедрении сторонней библиотеки или банального создания новой фичи, у вас есть наглядные условия и правила, по которым должны работать остальные части кода, даже после внесения изменений в проект. Так вы точно будете уверены, что та самая библиотека или фича ничего не сломали. Это же будет относится и к рефакторингу, после которого вы сможете проверить что логика всех модулей, которых этот рефактор затронул, работают согласно тестам.
- более чистый код. Хоть я и не советую выносить дополнительные проверки из кода (по типу проверки на null), но вы вполне можете переложить все это на тесты.

Недостатки:
- общая стоимость поддержки такой системы (помимо дисциплины, которая нужна вам для осознания того, что раз уж вы внедрили тестирование в проект, то и любой новый код должен содержать соотв. тесты, также стоит учитывать, что на поддержание всей системы тестов нужно время, т.к. помимо создания тестов их также нужно поддерживать в актуальном состоянии)
- фейковая уверенность. Помните, что вы пишете тесты, в которых описываете определенные условия, однако вы не всегда будете знать и предугадывать все условия, с которыми приложение может столкнуться в период своей работы.

Существует тауже целая методология разработки, основой которой являются тесты - TDD или Test Driven Development. Ее суть в том, что вы изначально пишете тесты, в которых описываете логику приложения, а только затем пишете код для прохождения тестов.

Напоследок еще раз скажу то, что было упомянуто вначале. Тестирование может быть оверхедом для некоторых проектов (особенно небольших по размеру).

Если же вам все еще интересно что такое Unit тесты и как их писать в Unity, давайте сначала разберемся с определениями.

# Что такое Unit Test

`Unit Test` - тест, предназначенный для тестирования отдельного юнита кода (фичи, метода и тд.). Юнит тесты создаются для проверки небольшой логики в конкретном сценарии при заданных условиях. Мы проверяем выполняется ли эта логика так как мы задумывали.

>Юнит тесты принудительно выполняют логику метода 

Главная ценность таких тестов - возможность проверить исправность того или иного модуля после его обновления или обновления связанного модуля. 

# Комплекс юнит тестов

Также существует понятие комплекса юнит тестов - класс\метод содержащий все юнит тесты, относящиеся к определенной логической группе.

Суть комплекса в том, что если хотябы один из тестов не проходит проверку - весь комплекс не проходит проверку.

![alt text](../assets/UnitTests/20260703012907.png)

*Спасибо [PatientZero](https://habr.com/ru/users/PatientZero/) за такую простую, но полезную иллюстрациюю, а также за его хорошую статью по юнит тестированию*
# Unity Test Framework (UTF)

`Unity Test Framework` - пакет Unity для написания тестов. Использует и расширяет библиотеку NUnit для .NET. В Unity эти расширения проявляются в возможности взаимодействия с концепциями движка (пропуск кадров, перезагрузка домена и тд).

Стоит также отметить, что тестирование того или иного модуля возможно только если он изолирован от других своим asndef'ом. Чтобы протестировать код в конкретном asmdef'e - он должен содержать ссылку, т.е. assembly reference не asmdef reference, на dll nunit библиотеки (пример будет показан ниже).

В заключение хочется сказать, что по сути UTF - это просто название пакета и более полное наименование всего инструментария, который есть в Unity для написания своих тестов. Рабочей лошадкой же является Unity Test Runner

# Unity Test Runner

_Window ▸ General ▸ Test Runner_.

![alt text](../assets/UnitTests/20260703034619.png)


`Unity Test Runner` - инструмент позволяющий запускать и проверять результаты определенных тестов.

![alt text](../assets/UnitTests/20260703034639.png)

*Пример сборки внутри пакета Zenject, где по умолч. есть dll с тестами, которые мы также можем проверить в окне Test Runner.*

В этом окне мы будем видеть тесты для разных режимво и результат их запуска.

Глобально тесты можно разделить на те что запускаются в Edit моде и в Player моде.

Однако прежде чем поговорить про каждый из них отдельно нужно выделить их общие стороны:

- у теста должен быть свой asmdef с референсом на `nunit.framework.dll`

![alt text](../assets/UnitTests/20260804072838.png)

- в  asmdef'е таких тестов нам также нужно указывать таргетную платформу/-ы - Editor для тестов только в редакторе

![alt text](../assets/UnitTests/20260718135347.png)

>Асмдеф с тестами не может содержать ссылку на предопределенную Assembly-Csharp.dll, в которую компилятся все скрипты по умолчанию

## Editor тесты

Запускаются только в Editor'е, имеют доступ к редактору и коду в рантайме. Такие тесты имеют доступ и к UnityEngine и к UnityEditor пространству имен.

Для их написания мы используем аттрибут `UnityTest`, а работают они на коллбеке EditorApplication.update, а не на корутине 

>Сам EditorApplication.update не привязан к Update циклу в Play режиме, вместо этого он работает на основе тиков редактора, которые не постоянны, зависят от конкретных условий, но обычно, редактор старается ориентироваться на значение `ApplicationIdleTime`, которое записывается в [[EditorPrefs]] и которое используется как интервал между тиками в редакторе, с дефолтным значением 4 сек. Некоторые операции (запуск в background'е, перетаскивание и проч.) могут повлиять на тик рейт 

В этой статье мы будем писать только Play Mode тесты, т.к Editor тесты скорее всего вы будете писать, когда захотите проверить логику какого нибудь пост процесса, самописной утилиты для движка и проч. Для самой игры они безусловно тоже могут быть полезны

## Player тесты

Позволяет тестировать код приложения в рантайме через корутину и атрибут `UnityTest`. Условия для написания таких тестов

- у них, также как и у Editor текстов, должен быть свой asmdef с референсом на `nunit.framework.dll`
- скрипты тестов должны быть в той же папке что и асмдеф
- тестовый асмдеф должен содержать ссылку на доп асмдеф, код которого мы будем тестить 

## UnityTest vs Test

Главным маркером, который будет определять ту или иную часть кода, как тест является соответствующий атрибут. В рамках этой статьи будут рассматриваться самые популярные решения в лице выше упомянутых NUnit и UTF (Unity Test Framwork). 

Мы можем использовать атрибут из библиотеки NUnit `Test` вместо `UnityTest` для обоих видов тестов в случаях если нам не нужно:
-  использовать yield инструкции для Editor тестов 
- нам не нужно ничего yield'ить (кадры, секунды, ивенты движка и проч.) в Play тестах

>Может это стоило сказать ранее, но Unity вообще не застявляет вас писать тесты через их обертку к NUnit библиотеке. Вы можете пользоваться исключительно API библиотеки и все будет работать точно также, однако, если вам нужно контролировать какие то фичи внутри жизненного цикла движка -  используйте синтаксис Unity и их UTF (Unity Test Framwork). Более подробно: https://docs.unity3d.com/Packages/com.unity.test-framework@2.0/manual/index.html

# Небольшое summary по введению 

И так мы уже поняли что:
- тесты - это здорово! Особенно при работе с ИИ
- любой тест - метод или их совокупность, которые выполняются принудительно
- у теста есть четкие условия когда он считается выполненным, а когда нет 
- Unity использует библиотеку NUnit в качестве основной, а также дополнение к ней в лице UTF (Unity Test Framwork). Помните, что вы можете использовать для написания тестов и то и другое, да хоть все сразу.
- тест выделяется определенным синтаксисом, в случае с Unity и C# - это атрибуты 

Теперь, когда мы разобрались с базой осталось разобраться, как же писать тесты самому?
# Пишем свой первый тест

Как мы уже поняли тест - метод внутри класса с особым атрибутом. Test Runner просто обходит все классы в папке с  asmdef'ом и принудительно выполняет их методы. 

В Unity мы можем бытро, через контекстное меню создать папку с тестами в иерархии проекта.

![alt text](../assets/UnitTests/20260804090459.png)

Тут автоматом будут прокинуты все нужные ссылки 

![alt text](../assets/UnitTests/20260804090640.png)

>Такое разделение позволяет Unity, да и нам, как разработчикам, отделять source код от кода с тестами

Далее, для того чтобы наша сборка с тестами могла обращаться к типам самой игры, мы должны создать asmdef в папке, код и логику которой мы хотим протестировать, а затем добавить ее в asmdef ref в сборке в папке тестов.

В этой статье будем писать тесты к самописному контроллеру персонажа, в котором есть функционал двойного прыжка, приседания и дэша. Как раз все эти фичи нам предстоить обложить тестами. 
Дабы не вставлять сюда сотни строчек кода, ограничемся только теми методами и значениями, которые будем тестировать.

Сигнатура теста 

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

Сам класс с тестами не является тестом, поэтому не содержит никаких атрибутов 

## Пару слов про DI в тестах

>К примеру у Zenject'а есть собственные обертки для тестирования, которые упрощают процесс создания тестов с использованием концепции DI. Ниже будет приведена лишь базовая информация для юнит тестов, коими фреймворк не ограничивается. 
>
>Стоит добавить, что тут я не буду рассказывать об дополнительных атрибутах, типах и проч., т.к. считаю, что они лишь усложняют использования DI при Unit-тестировании, путем создания под капотом новых контекстов и контейнеров. Куда проще просто в тесте создать контейнер и биндить\резолвить все что душе угодно. 
>
>Однако для интеграционных тестов (тесты не отдельных юнитов/модулей, а целых систем, в которых эти самые моудли взаимодействуют (это могут быть как взаимодействие внутреннее так и внешнее)) у Zenject'а есть достаточно полезные инструменты.
>
>![alt text](../assets/UnitTests/20260827132916.png)
>
>Если хотите почитать подробнее вот ссылка из их репозитория https://github.com/modesttree/Zenject/blob/master/Documentation/WritingAutomatedTests.md . В данной статье речь пойдет только про Zenject, для любых других DI фреймворах смотрите их оф. документацию.

 На самом деле с DI в тестах все просто - создаете контейнер и все готово. Вам не нужно регистрировать сам тест в инсталлерах или их аналогах. 
 
 Резолв зависимостей может происходить через `Resolve()` метод контейнера либо через атрибут `[Inject]`

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

>`[SetUp]` атрибут и его аналог в UTF `[UnitySetUp]`, позволяют добавлять логику инициализации в тесты. Такой метод не будет считаться тестом.
>

Как видно, мы успешно получаем контейнер.

![alt text](../assets/UnitTests/20260842109145.png)

Вовзращаемся к написанию теста)

Мы уже посмотрели на сетап метод с соотв. атрибутом. Тут мы руководствуеся правилом, про которое писал выше - если нам не нужен yield синтаксис - используем атрибуты из NUnit библиотеки

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


Немного про классы, которые представленны выше:
- `CharacterConfig`
обычнй SO'шник в котором прописанны значения для соотв. параметров перемещения персонажа, в том числе скорость его прыжка, окно между повторными нажатиями кнопок A\D для рывка, коэфициент замедления при примедании и так далее 
- `CharacterInputFake`
созданный тут же мок-модуль для имитации работы реального контроллера инпута. Реализует интерфейс `ICharacterInput` где не так уж и много членов

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

- `CreateGround`
создает поверхность с коллайдером, для спавна на ней персонажа.

```c#
private static GameObject CreateGround()  
{  
    GameObject ground = new GameObject("Test Ground");  
    ground.transform.position = new Vector2(0f, -0.5f);  
    ground.AddComponent<BoxCollider2D>().size = new Vector2(10f, 1f);  
    return ground;  
}
```

- `CreatePlayer`
создает тестовый GO персонажа с Rigidbody и капсульным коллайдером

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

- `PlayerCharacterController`
контроллер персонажа, который непосредственно двигает GO на сцене
- коллайдер с GO персонажа

Первый тест, из общего сета, будет касаться прыжка, а именно проверки на то, что наш прыжок работает и персонаж действительно поднимается по оси Y а заданное в конфиге значение.

```c#
[UnityTest]  
public IEnumerator OneJump_AppliesConfiguredJumpVelocity()  
{  
    yield return PressJump();  
  
    AssertJumpVelocity();  
}
```

`PressJump` имитирует нажатие пробела в нашем мок инпут контроллере

```c#
private IEnumerator PressJump()  
{  
    _input.PressJump();  
    yield return new WaitForFixedUpdate();  
}
```

В самом инпут контроллере просто вызывается соотв. ивент

```c#
public void PressJump()  
{  
    JumpPressed?.Invoke();  
}
```

Теперь настало время поговорить, как в коде мы задаем условие, при выполнении которого тест будет считаться успешно пройденным и при невыполнении которого, соответственно, проваленным.

```c#
private void AssertJumpVelocity()  
{  
    Assert.That(  
        _body.linearVelocity.y,  
        Is.EqualTo(_config.JumpVelocity).Within(0.001f));  
}
```

Знакомьтесь, класс `Assert` из библиотеки NUnit. Именно его API и будет определять итоговый статус теста. Тип является одним из ключевых во всей библиотеке, а его главная задача - проверять истинность переданного условия. Если вам интересно полностью прочитать документацию данного типа, вот: https://docs.nunit.org/articles/nunit/writing-tests/assertions/assertions.html?q=Assert.

Если вкратце: в версиях NUnit 3.0+ практически все assertions пишутся с использованием метода `That()` и используют так называемую `Constraint Model`. К примеру:

```csharp
Assert.That(myString, Is.EqualTo("Hello"));
```

использует первым аргументом значение, а вторым специальный синтаксис, который под капотом создает Constraint, класс, который непосредственно осуществляет проверку условия. В примере выше будет создаваться `Equal Constraint`. Суть в том, чтобы заключить логику проверки в одном конкретном классе, передаваемом в качестве второго параметра. Полный список constraint: https://docs.nunit.org/articles/nunit/writing-tests/constraints/Constraints.html

В более старых версиях библиотеки проверки осуществлялись через специальные методы. Т.е. для каждого типа проверки был отдельный метод (прим. `Assert.AreEqual`). 

>Не путайте класс `Assert` из библиотеки NUnit и `Assert` из пространства имен `UnityEngine.Assertions`. Оба используют концепцию assertion - мы записываем утверждение в метод класса Assert, который под капотом проверяет является ли оно истинным или нет. Если условие оказывается ложным - метод не возвращает управление, а логает ошибку. Также если в Assert мы передадим несколько условий, метод вернет управление только в том случае, если все условия оказались истинными (очень похоже на логику работы сетов юнит-тестов)

И так, мы разобрались что делает `Assert.That()`, посмотрим на код проверки из нашего теста еще раз.

```c#
Assert.That(  
        _body.linearVelocity.y,  
        Is.EqualTo(_config.JumpVelocity).Within(0.001f));  
```

Как вы уже догадались, мы просто проверяем, равняется ли скорость Rigidbody значению из конфига с погрешностью в 0.001.

Давайте попробуем запустить наш первый тест.

![alt text](../assets/UnitTests/20260884022184.png)

Теперь мы можем увидеть его в окне Test Runner, в соотв. dll. Для запуска конкретного теста или конкретной папки с тестами, достаточно кликнуть по нужному объекту в иерархии два раза. Для запуска всех тестов в проекте можно нажать `Run All` в нижнем правом углу.

![alt text](../assets/UnitTests/20260817482903.png)

Тест прошел проверку.

Для наглядности вот конфиг персонажа. Как видим, наша скорость прыжка равна 10, а значит и на тестах персонаж прыгнул на аналогичное значение, или близкое к нему с погрешностью в 0.001 

![alt text](../assets/UnitTests/20260810492039.png)


Теперь напишем тест для проверки двойного прыжка 

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

Здесь, аналогично прошлому тесту, после проверки первого прыжка, мы отключаем землю под персонажем и имитируем второй прыжок, также проверяя соответсвует ли velocity по y заданному значению в конфиге.

Следующим в сете тестов у нас будет тест возможности приседания. Логично предположить, что хорошим тестом для данной фичи будет проверка прохождения какого-нибудь препятствия, в момент когда персонаж в режиме приседания

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

Разберем код выше по порядку:
- получаем высоту коллайдера в приседе и стоя
- `CreateLowCeiling` 
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

метод расчитывает высоту сощдаваемого препятствия (в нашем случае мы создаем потолок) и помещает его над персонажем, но пройти его можно только будучи в приседе.

Сам присед меняет размер коллайдера и мультипликатор движения. При дальнейшем вызове в тесте `_input.SetCrouchHeld(true)` вызывает соотв. ивент и обработчик в контроллере персонажа

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

Тут же в контроллере мы проверяем флаг и если персонаж в приседе изменяем его горизонтальную скорость

```c#
float speedMultiplier = _isCrouched  
    ? _config.CrouchSpeedMultiplier  
    : 1f;  
  
horizontalVelocity =  
    _input.Horizontal *  
    _config.MovementSpeed *  
    speedMultiplier;
```

Далее в тесте идет два assertion'а

```c#
Assert.That(  
        _collider.size.y,  
        Is.EqualTo(crouchedHeight).Within(0.001f));  
        
    Assert.That(  
        Physics2D.Distance(_collider, ceilingCollider).isOverlapped,  
        Is.False,  
        "The crouched collider should fit below the obstacle.");  
```

Первый уже вам знакомый `Is.EqualTo()`, который с погрешностью в 0.001 проверяет равна ли высота коллайдера его высоте после умножения начальной высоты на `CrouchHeightRatio` значения из конфига (это кожфициент, на который будет уменьшаться коллайдер при приседании и если в нашем конфиге 0.55, то и уменьшаться он будет чуть больше чем в два раза).

`Is.False` создает False Constraint, проверяющий является ли переданное выражение ложью. Если переданное выражение является истинной - метод логает ошибку с сообщением, которое мы передали в метод последним параметром. В данном случае мы смотрим, через `Physics2D.Distance`, что расстояние между коллайдером персонажа и коллайдером потолка не пересекается (т.е. не isOverlapped.)

```c#
public bool isOverlapped => (double) this.m_Distance < 0.0;
```

Это то как мы получаем поле в  `ColliderDistance2D`. Если это значение равно нулю - коллайдеры соприкасаются друг с другом своими внешними ребрами, а отрицательное значение, соответственно, показывает, что коллайдеры пересекаются.  

Также к тесту можно добавить логику, проверяющую, что если над персонажем есть препятствие - он останется в приседе. Для этого достаточно передать в инпут контроллер false флаг и посмотреть каким будет высота коллайдера игрока (она должна остаться равной значению его обычной высоты на коэфициент из конфига)

```c#
_input.SetCrouchHeld(false);  
    yield return new WaitForFixedUpdate();  
  
    Assert.That(  
        _collider.size.y,  
        Is.EqualTo(crouchedHeight).Within(0.001f),  
        "The controller should remain crouched while standing is obstructed."); 
```

После написания, этот тест можно также увидеть в окне Test Runner

![alt text](../assets/UnitTests/20260817482930.png)

Попробуем запустить 

![alt text](../assets/UnitTests/202608238374195.png)

Все тесты завершились успешно.

Остался заключительный тест для сета - проверка дэша.

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

В `_input.RequestDash(1)` сюда мы передаем направление, в котором должен совершаться дэш (-1 влево и 1 вправо, при 0 мы просто скипаем метод). RequestDash вызывает соотв. метод, а в контроллере персонажа мы вызываем вот такой обработчик:

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

В контроллере также идет расчет времени, когда игрок сможет в след. раз нажать дэш, путем расчета глобального времени с момента старта FixedUpdate на монобехе `Time.fixedTime`.

Вынес в отдельный метод проверку горизонтальной скорости персонажа

```c# 
private void AssertHorizontalVelocity(float expectedVelocity)  
{  
    Assert.That(  
        _body.linearVelocity.x,  
        Is.EqualTo(expectedVelocity).Within(0.001f));  
}
```

Далее ждем пока пройдет время дэща и проверяем, что скорость коллайдера персонажа равна нулю (он полностью остановился)

```c#
AssertHorizontalVelocity(0f);
```

Следующий Assert 

```c#
Assert.That(  
    Time.fixedTime,  
    Is.LessThan(firstDashStartedAt + _config.DashCooldown),  
    "The test requires the dash duration to be shorter than its cooldown.");
    
  
_input.RequestDash(-1);  
yield return new WaitForFixedUpdate();  
  
AssertHorizontalVelocity(0f);
```

Он создает `LessThan Constraint`, который проверяет является ли передаваемое значение меньше определенного значения, передающимся вторым аргументом. В данном случае мы проверяем что дэш не может сработать, если не прошел кулдаун с прошлого дэша.  Сначала проверяем время, а затем пробуем вызывать дэш в другую сторону и сразу проверяем что персонаж не двигался через `AssertHorizontalVelocity(0f);`.

В конце ждем пока пройдет кулдаун и еще раз вызываем дэш влево уже с проверкой что горизонтальная скорость соответствует заданной в конфиге

```c#
while (Time.fixedTime < firstDashStartedAt + _config.DashCooldown)  
{  
    yield return new WaitForFixedUpdate();  
}  
  
_input.RequestDash(-1);  
yield return new WaitForFixedUpdate();  
  
AssertHorizontalVelocity(-_config.DashSpeed);
```

Вот и все, теперь у нас есть сет тестов, отвечающих за специальные возможности мувмента персонажа.

![alt text](../assets/UnitTests/202608193847282.png)

Сет может считаться успешно пройденным

![alt text](../assets/UnitTests/20260818374911.png)

# Заключение

Надеюсь мне удалось показать вам процесс тестирования с разных строн. Несмотря на то, что это действительно полезный инструмент, который может сэкномить вам кучу времени, он так же требует ресурсов на подержание и отладку. Не думайте о нем как о "must have" в каждом новом проекте, если только вы не планируете разработку по методологии TDD. 

В этом материале я просто хотел показать основы работ при написании юнит тестов и закрепить, больше для себя, пройденый материал. Если вы планируете изучение этой темы на более глубоком уровне, то лучшее, что я вам могу посоветовать - это документация Unity https://docs.unity3d.com/Packages/com.unity.test-framework@2.0/manual/index.html (не забудьте выбрать актуальную версию) и документацию NUnit https://docs.nunit.org/. 
