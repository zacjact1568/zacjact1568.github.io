---
title: 使用 Kotlin Android 扩展中的合成属性
slug: using-synthetic-properties-of-kotlin-android-extensions
date: 2018-02-12
---

Kotlin 当前最主要的应用就是 Android 应用程序开发了吧，毕竟已经被 Google “钦点”为 first-class 支持的语言了。事实上，在此之前 Kotlin 团队就推出了一个叫 Kotlin Android 扩展（Kotlin Android Extensions）的工具包，里面包含了一些 Android 应用程序开发很好用的工具，虽然暂时还很少，但是其中用来绑定视图的合成属性（Synthetic Properties）已经算是重磅级的功能了。

这篇文章介绍下 Kotlin Android 扩展中的合成属性。

<!-- more -->

# 介绍

如果要在代码中引用布局文件中定义的控件，可以使用 `findViewById`，但是一个复杂的界面需要写很多 `findViewById`，相当麻烦，所以也可以用 ButterKnife 的 `@BindView`，配合 ButterknifeZelezny 插件可以实现自动生成 `@BindView` 语句，然而感觉其实这样也没节省多少时间，代码里依然一大堆 `@BindView`。但是有了合成属性，不仅在大部分情况下可以丢掉 `findViewById` 了，也可以完全丢掉 `@BindView` 了。

# 启用 Kotlin Android 扩展

在**模块级** `build.gradle` 文件中添加

```groovy
...
apply plugin: 'kotlin-android-extensions'
```

然后，Sync Project with Gradle Files。

# 使用方法

例如，在布局文件 `activity_main.xml` 中定义一个 `TextView`，它的 `id` 名为 `text_title`：

```xml
<TextView
    android:id="@+id/vTitleText"
    .../>
```

使用 Android 自带的方式，即使用 `findViewById`：

```kotlin
class MainActivity : AppCompatActivity() {
    val titleText by lazy { findViewById(R.id.vTitleText) as TextView }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        titleText.text = "This is Title"
    }
}
```

使用 ButterKnife 的 `@BindView`，即依赖注入：

```kotlin
class MainActivity : AppCompatActivity() {

    @BindView(R.id.vTitleText)
    lateinit var titleText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        ButterKnife.bind(this)
        titleText.text = "This is Title"
    }
}
```

使用合成属性：

```kotlin
import kotlinx.android.synthetic.main.activity_main.*

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        vTitleText.text = "This is Title"
    }
}
```

合成属性方式非常简洁，首先，使用 `import` 关键字将某个布局文件中的控件对应的合成属性全部导入：

```kotlin
import kotlinx.android.synthetic.main.<布局文件名>.*
```

然后就可以直接使用控件的 `id` 名来引用在布局文件中定义的控件，看起来好像是使用类的属性一样。

{{< notice info >}}

大多数 Android 开发者习惯使用下划线命名法来为在布局文件中定义的控件的 `id` 命名，例如上面的 `TextView` 就命名为 `title_text`。其实，为了使 `id` 名看起来更像一个属性，我习惯使用“`v`”作为前缀（代表“`view`”），其他单词首字母大写，那么，以上 `TextView` 的 `id` 就命名为 `vTitleText`。当然，这只是我个人的编程习惯而已。

{{< /notice >}}

# 原理

要想看看 Kotlin Android 扩展在编译时期做了什么工作，最好的方式就是查看编译成的字节码，从 Tools | Kotlin | Show Kotlin Bytecode 打开查看字节码的窗口，如图：

![](http://upload-images.jianshu.io/upload_images/1771371-142a6e530f8b25d9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

右边就是编译成的字节码，然而这只有大神才看得懂了，反正我是看不懂。所以点击 Kotlin Bytecode 窗口左上角的 Decompile 按钮，将字节码再反编译成 Java 代码：

![](http://upload-images.jianshu.io/upload_images/1771371-5b0cb88be5f68054.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这样就看得懂了。找到使用合成属性 `vTitleText` 的地方：

```java
TextView var10000 = (TextView)this._$_findCachedViewById(id.vTitleText);
Intrinsics.checkExpressionValueIsNotNull(var10000, "vTitleText");
var10000.setText((CharSequence)"This is Title");
```

使用了 `_$_findCachedViewById` 方法获取控件的引用，看这个方法名就知道是有缓存的，找到这个方法：

```java
public View _$_findCachedViewById(int var1) {
    if(this._$_findViewCache == null) {
        this._$_findViewCache = new HashMap();
    }

    View var2 = (View)this._$_findViewCache.get(Integer.valueOf(var1));
    if(var2 == null) {
        var2 = this.findViewById(var1);
        this._$_findViewCache.put(Integer.valueOf(var1), var2);
    }

    return var2;
}
```

可以看出，控件的引用被缓存在 `_$_findViewCache` 这个 HashMap 对象中，以控件 ID 和控件引用键值对的方式存储。这样的缓存模式会自动应用在 Activity、Fragment 和自定义 View 中，所以可以在这些类中放心使用。

# 特殊情况

某些情况下，使用合成属性需要慎重考虑。以 RecyclerView 的 Adapter 类中的 ViewHolder 为例，如果是在 ViewHolder 中使用合成属性从 `itemView` 中取控件引用，赋值给新定义的变量，像这样：

```kotlin
class PersonListAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ItemViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_list_person, parent, false))
    
    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        (holder as ItemViewHolder).nameText.text = "Zack"
    }
    
    override fun getItemCount() = 1
    
    class ItemViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val nameText = itemView.vNameText
    }
}
```

将这个类编译成的 Kotlin 字节码再反编译成 Java 代码，来看看 `onBindViewHolder` 方法和 `ItemViewHolder` 类：

```java
public void onBindViewHolder(@NotNull ViewHolder holder, int position) {
    Intrinsics.checkParameterIsNotNull(holder, "holder");
    TextView var10000 = ((PersonListAdapter.ItemViewHolder)holder).getNameText();
    Intrinsics.checkExpressionValueIsNotNull(var10000, "(holder as ItemViewHolder).nameText");
    var10000.setText((CharSequence)"Zack");
}

public static final class ItemViewHolder extends ViewHolder {
    private final TextView nameText;

    public final TextView getNameText() {
        return this.nameText;
    }

    public ItemViewHolder(@NotNull View itemView) {
        Intrinsics.checkParameterIsNotNull(itemView, "itemView");
        super(itemView);
        this.nameText = (TextView)itemView.findViewById(id.vNameText);
    }
}
```

可以看出，虽然没有应用类似上面的缓存机制，这种方式依然应用了 ViewHolder 缓存控件引用的功能，即在构造方法中执行 `findViewById` 获取控件引用，储存到类中定义的成员变量中（这里为 `nameText`），所以这样使用是没有任何问题的。

然而这样写又太麻烦了有没有，和直接用 `findViewById` 并没有什么区别，能不能直接在 `onBindViewHolder` 中使用合成属性从 `itemView` 中取 item 子控件的引用呢，像这样：

```kotlin
class PersonListAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    ...
    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        holder.itemView.vNameText.text = "Zack"
    }
    
    class ItemViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView)
}
```

将这个类编译成的 Kotlin 字节码再反编译成 Java 代码，来看看 `onBindViewHolder` 方法和 `ItemViewHolder` 类：

```java
public void onBindViewHolder(@NotNull ViewHolder holder, int position) {
    Intrinsics.checkParameterIsNotNull(holder, "holder");
    View var10000 = holder.itemView;
    Intrinsics.checkExpressionValueIsNotNull(holder.itemView, "holder.itemView");
    TextView var3 = (TextView)var10000.findViewById(id.vNameText);
    Intrinsics.checkExpressionValueIsNotNull(var3, "holder.itemView.vNameText");
    var3.setText((CharSequence)"Zack");
}

public static final class ItemViewHolder extends ViewHolder {
    public ItemViewHolder(@NotNull View itemView) {
        Intrinsics.checkParameterIsNotNull(itemView, "itemView");
        super(itemView);
    }
}
```

重点关注 `onBindViewHolder` 方法体内第 4 行，直接调用了 `itemView` 的 `findViewById` 方法，并没有应用类似上面的缓存机制，同时也没有使用到 ViewHolder 缓存控件引用的功能。RecyclerView 的 Adapter 刷新 item 的时候会调用 `onBindViewHolder`，这样的话，每次在刷新 item 的时候都会去调用 `findViewById`，这是一个遍历控件树执行搜索操作的方法，应用在 RecyclerView 这类集合控件上，非常影响性能。Kotlin 团队显然意识到了这个问题，在 Kotlin 的 1.1.4 版本中提供了解决方案，在 Adapter 的 ViewHolder 中也可以使用合成属性而不影响性能。

首先，必须启用 Kotlin Android 扩展的实验特性，在**模块级** `build.gradle` 文件中添加

```groovy
...
androidExtensions {
    experimental = true
}
```

然后，Sync Project with Gradle Files。

对以上 `ItemViewHolder` 类稍作修改，实现 `LayoutContainer` 接口，将其构造函数的参数改为从这个接口继承的 `containerView` 属性，就可以在 `onBindViewHolder` 中直接通过 ViewHolder 获取 item 子控件的引用了，相当于跳过 `itemView` 而直接从 `ItemViewHolder` 中取 `itemView` 的合成属性，像这样：

```kotlin
class PersonListAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    ...
    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        (holder as ItemViewHolder).vNameText.text = "Zack"
    }
    
    class ItemViewHolder(override val containerView: View) : RecyclerView.ViewHolder(containerView), LayoutContainer
}
```

将这个类编译成的 Kotlin 字节码再反编译成 Java 代码，来看看 `onBindViewHolder` 方法和 `ItemViewHolder` 类：

```java
public void onBindViewHolder(@NotNull ViewHolder holder, int position) {
    Intrinsics.checkParameterIsNotNull(holder, "holder");
    TextView var10000 = (TextView)((PersonListAdapter.ItemViewHolder)holder)._$_findCachedViewById(id.vNameText);
    Intrinsics.checkExpressionValueIsNotNull(var10000, "(holder as ItemViewHolder).vNameText");
    var10000.setText((CharSequence)"Zack");
}

public static final class ItemViewHolder extends ViewHolder implements LayoutContainer {
    ...
    public View _$_findCachedViewById(int var1) {
        if(this._$_findViewCache == null) {
            this._$_findViewCache = new HashMap();
        }

        View var2 = (View)this._$_findViewCache.get(Integer.valueOf(var1));
        if(var2 == null) {
            View var10000 = this.getContainerView();
            if(var10000 == null) {
                return null;
            }

            var2 = var10000.findViewById(var1);
            this._$_findViewCache.put(Integer.valueOf(var1), var2);
        }

        return var2;
    }
}
```

有没有看到熟悉的东西，是的，就是 `_$_findCachedViewById` 方法，成功在 ViewHolder 中应用了缓存机制，可以放心地在 Adapter 中使用合成属性了。

综上所述，这种方式仅适用于特定的类，这个类（上面的 `ItemViewHolder`）要有一些控件属性（上面的 `itemView`），`itemView` 有一些子控件（上面的 `vNameText`）。需求是使用合成属性从 `itemView` 中取 `vNameText`，通常是 `itemViewHolder.itemView.vNameText` 的形式（`ItemViewHolder` 实例化为 `itemViewHolder`），但是这样并不会应用缓存机制，每次都要去 `findViewById`。这种情况下就可以让 `ItemViewHolder` 类实现 `LayoutContainer` 接口，将其构造函数的参数 `itemView` 替换成从此接口继承的 `containerView` 属性，就可以将 `containerView` 中的 `vNameText` 提出来，直接使用 `itemViewHolder.vNameText` 的形式，这样就会应用缓存机制了。实际上，符合这样条件的类我就只能想到 Adapter 的 ViewHolder 了。

# 参考资料

- [Kotlin Android Extensions - Kotlin Programming Language](http://kotlinlang.org/docs/tutorials/android-plugin.html)
- [Kotlin Android Extensions: Say goodbye to findViewById](https://antonioleiva.com/kotlin-android-extensions/)

# 后记

实际上以前写过一篇关于 Kotlin 的文章，但是现在看来自己那时像是在为写而写，真的是没必要，因为那里面的大部分东西都可以在官方文档中查到，实际上那些东西我就是看着官方文档来写的。但是最后一部分 Kotlin Android 扩展却的确是我查阅资料认真思考过的，于是就把这一部分单独抽出来写一篇文章，也算是展示了下自己在此期间的收获吧。


