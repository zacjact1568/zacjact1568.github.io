---
title: "为 Fragment 定义事件回调的两种方式"
date: "2018-04-21"
excerpt: "在 Android 中使用 Fragment 时，我们常常会在 Fragment 中定义一些按钮监听之类的事件。在我看来，为 Fragment 中的事件定义回调函数有两种方式，一种是实现接口，另一种是传递函数类型（Kotlin）或匿名内部类（Java）。前一种较为简单，也是[官方教程](https://developer.android.com/training/basics/fragments/communicating.html)中提到的方式，后一种因为考虑到 Activity 重建的问题，有一些需要注意的地方。这篇文章介绍了这两种方式。"
---

在 Android 中使用 Fragment 时，我们常常会在 Fragment 中定义一些按钮监听之类的事件。在我看来，为 Fragment 中的事件定义回调函数有两种方式，一种是实现接口，另一种是传递函数类型（Kotlin）或匿名内部类（Java）。前一种较为简单，也是[官方教程](https://developer.android.com/training/basics/fragments/communicating.html)中提到的方式，后一种因为考虑到 Activity 重建的问题，有一些需要注意的地方。这篇文章介绍了这两种方式。

{# {"type": "notice", "level": "info", "content": "本文使用的编程语言为 Kotlin"} #}

# Fragment 在 Activity 重建时的行为

众所周知，初始化 Fragment 向其传递参数时，应该使用工厂模式。即定义一个“静态”函数（一般名为 `newInstance`），在此函数中创建 Fragment 对象，并将参数保存在 `arguments` 中，后续再从 `arguments` 中取参数。例如初始化一个 `ExampleFragment`：

```kt
class ExampleFragment : Fragment() {

    companion object {
    
        fun newInstance(val param: Int): ExampleFragment {
            val args = Bundle()
            args.putInt("param", param)
            val fragment = ExampleFragment()
            fragment.arguments = args
            return fragment
        }
    }
    ...
}
```

为什么要这样做，而不是直接将参数通过构造函数传入呢？因为当某些事件，例如旋转屏幕、切换分屏等造成该 Fragment（直接或间接）附着的 Activity 重建时，类中属性对应的对象全部都会被回收，除了 `arguments` 的 `Bundle` 对象。在 Fragment 附着的 Activity 准备重建时，该对象会保存在 Activity 的那个 `Bundle` 对象中（就是 `onCreate` 等生命周期回调函数的参数 `savedInstanceState`，我也不知道叫什么名字😑），然后在恢复的时候，Activity 会直接反射调用该 Fragment 的默认无参构造函数，然后将该 Fragment 对应的 `Bundle` 取出，传递给它的 `arguments` 属性。所以通过构造函数传递的参数这时候就完全取不到了，而保存在 `arguments` 中的参数就还健在。关于这方面的资料已有很多，此处就不再赘述了。

# 传递事件的回调函数

一个 Fragment 中可能会定义一些事件（例如 Fragment 中的某个按钮的触摸事件），当这些事件发生了，需要通知附着的宿主类（可以是 Activity 或父 Fragment）进行相应的处理，这就需要向 Fragment 传递事件的回调函数。回调函数定义成函数类型的属性，让 Fragment 在事件发生时通过这个属性调用回调函数即可。

那么，这个回调函数怎样传入呢？基于上面提到的方式，自然想到了使用工厂模式传入。然而，仔细想想，发现这样并不行，因为 `arguments` 是个 `Bundle` 类型的属性，所能存储的变量类型是有限制的，并不支持函数类型（Java 中是匿名内部类）的存储。那么，就需要找到其他的方法传入回调函数，并且在 Activity 重建的时候能恢复。

# 第一种方式：实现接口

这是官方教程中提到的方式。具体来说，就是在 Fragment 中定义一个接口，然后宿主类实现这个接口，重写相应的函数，在 Fragment 中将宿主类强制转换成这个接口类，就可以在 Fragment 中通过这个接口调用回调函数了，也就实现了对宿主类的通知。以一个 `ExampleFragment` 为例（与官方教程相比有改动）：

```kt
class ExampleFragment : Fragment() {

    private val callback: Callback? by lazy {
        when {
            // 如果该 Fragment 作为子 Fragment 附在某个父 Fragment 上，且父 Fragment 实现了 Callback 接口
            parentFragment != null && parentFragment is Callback -> parentFragment as Callback
            // 如果该 Fragment 附在某个父 Fragment 上，但其未实现 Callback 接口
            // 但该 Fragment（直接或间接）附在了某个 Activity 上，且 Activity 实现了 Callback 接口
            activity != null && activity is Callback -> activity as Callback
            // 该 Fragment 没有附到任何 Activity 或父 Fragment 上，或它们都没有实现 Callback 接口
            else -> null
        }
    }
    
    interface Callback {
        fun onSomethingHappened()
    }
    ...
}
```

它附在了 `MainActivity` 上，则 `MainActivity` 必须实现 `ExampleFragment.Callback` 接口：

```kt
class MainActivity : AppCompatActivity(), ExampleFragment.Callback {

    overrive fun onSomethingHappened() {
        ...
    }
    ...
}
```

这样并不用考虑该 `ExampleFragment` 附着的 `MainActivity` 重建的问题，因为只要 `MainActivity` 实现了 `ExampleFragment.Callback` 接口，就算 `MainActivity` 重建了，也能在 `ExampleFragment` 中拿到 `ExampleFragment.Callback` 对象，就可以调用回调函数通知 `MainActivity` 了。

# 向 Fragment 传递参数的另一种方式

实际上，还有另一种方式向 Fragment 传递参数，它就是直接对 Fragment 中的属性赋值（即调用属性的 Setter），只是需要重写属性默认的 Setter，将属性的新值保存到 `arguments` 中，也可以实现在 Activity 重建时的恢复，并且还可以随时更改属性的值，更改后的值也会保存到 `arguments` 中。以一个 `ExampleFragment` 为例，它附着在 `MainActivity` 上：

```kt
class ExampleFragment : Fragment() {

    var param = 0
        set(value) {
            // 更新幕后字段
            field = value
            // 刷新相关的控件等
            updateView()
            // 将新值储存到 arguments
            arguments!!.putInt("param", value)
        }
    ...
}
```

那么，如果要传递事件的回调函数呢？也可以这样定义：

```kt
class ExampleFragment : Fragment() {

    var somethingHappenListener: (() -> Unit)? = null
    ...
}
```

实际上这是对 Fragment 中的函数类型的属性赋值。然而这里并没有重写默认的 Setter 将事件的回调函数存储到 `arguments` 中，原因上面已经提到过了。这样就造成了如果 `MainActivity` 重建，`somethingHappenListener` 这个属性就为空了，`ExampleFragment` 自然没法在事件发生时通知到 `MainActivity` 了。

# 第二种方式：传递函数类型

那么怎样才能使用属性赋值的方式向 Fragment 传递事件的回调函数呢？可以从传递的时机下手。如果只是在新建 Fragment 的时候传递，那么当然 Activity 重建后 Fragment 就没法调用回调函数了。那如果在每次 Fragment 附到 Activity 或父 Fragment 的时候传递呢，这样不就行了。基于此，我找到了一个很有用的回调函数，它就是 `onAttachFragment`，看下此函数的[文档](https://developer.android.com/reference/android/support/v4/app/FragmentActivity.html#onAttachFragment(android.support.v4.app.Fragment))（以 `android.support.v4.app.FragmentActivity` 中的为例）：

{# {"type": "notice", "level": "note", "content": "Called when a fragment is attached to the activity."} #}

也就是说，当 Fragment 附着到 Activity 上时会调用此函数，而此函数的参数就是附着到 Activity 上的那个 Fragment，这不正是我们想要的吗。所以，就可以在这个函数中向 Fragment 传递事件的回调函数了，以 `MainActivity` 为例：

```kt
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (savedInstanceState == null) {
            // 创建 ExampleFragment（忽略其他参数的传入）
            supportFragmentManager.beginTransaction().add(R.id.vContainer, ExampleFragment(), "example").commit()
        }
    }
    
    override fun onAttachFragment(fragment: Fragment) {
        super.onAttachFragment(fragment)
        if (fragment.tag == "example") {
            (fragment as ExampleFragment).somethingHappenListener = { ... }
        }
    }
    ...
}
```

{# {"type": "notice", "level": "warning", "content": "注意，这里的例子是 Fragment 继承于 `android.support.v4.app.Fragment` 的情况，`onAttachFragment` 也是重写 `android.support.v4.app.FragmentActivity` 的（其参数类型是 `android.support.v4.app.Fragment`），而如果 Fragment 继承于 `android.app.Fragment` 的话，需要重写 `android.app.Activity` 中的 `onAttachFragment`（其参数类型是 `android.app.Fragment`）。"} #}

在 Fragment 中也有 `onAttachFragment` 函数，只是其参数名为 `childFragment`，当某个 Fragment 作为子 Fragment 附在此 Fragment 上时会调用。创建 Fragment 的时候也需要使用 `childFragmentManager` 而不是 `fragmentManager`。

这样，就算 Activity 再怎么重建，只要宿主类有将 Fragment 附到其上的行为，事件的回调函数就一定可以传递到 Fragment 中，就可以愉快地在宿主类中使用属性赋值的方式向 Fragment 传递事件的回调函数啦。

# 后记

为什么要想到属性赋值的方式向 Fragment 传递事件的回调函数呢，因为如果使用官方推荐的那种工厂模式 + 实现接口的方式，中途如果需要修改某个参数，还是需要使用属性赋值的方式传递新值到 Fragment，还不如直接全部用属性赋值的方式呢。但实际上我更喜欢混用，即使用建造者（Builder）模式传递可以储存在 `arguments` 中的参数，使用属性赋值的方式传递事件的回调函数（即传递函数类型）以及更新所有的参数。因为我不太喜欢使用实现接口的方式来传递事件的回调函数，不仅仅是 Fragment，像控件的触摸事件，我一般只会用 `setOnClickListener` 而不是实现 `View.OnClickListener` 接口。当然，这些都是后话了。