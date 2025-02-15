---
title: "排查 LottieAnimationView 的 ColorFilter 失效的问题"
date: "2023-10-12"
excerpt: "最近在使用 Android 的 Lottie 动画库的时候发现了一个问题，对 LottieAnimationView 设置的 ColorFilter（可以理解为动画的颜色）在某些情况下会失效。"
---

最近在使用 Android 的 Lottie 动画库的时候发现了一个问题，对 LottieAnimationView 设置的 ColorFilter（可以理解为动画的颜色）在某些情况下会失效。

{# {"type": "notice", "level": "info", "content": "本文基于 Lottie 6.1.0 和 Android API Level 33"} #}

# Lottie 简介

首先介绍一下 [Lottie](https://airbnb.design/lottie/)，它是由 Airbnb 开源的动画库，支持播放由 After Effects 制作并由 Bodymovin 插件以 JSON 导出的动画文件。动画在 Android 平台上的承载对象是 `LottieAnimationView`。

动画的颜色既可以由设计师在设计的时候指定，导出在动画文件中，也可以后续在 XML 布局文件中使用 `LottieAnimationView` 的 ColorFilter 设置：

```xml
<com.airbnb.lottie.LottieAnimationView
    ...
    app:lottie_colorFilter="@color/loading_animation" />
```

使用 ColorFilter 的好处是对于设计师提供的一份动画文件，我们可以任意修改动画的颜色，例如让动画在深色模式和浅色模式使用不同的颜色。

但上述方法存在这样一个问题，**如果在动画加载完成之前调用过 `LottieAnimationView` 的 `cancelAnimation` 或者 `pauseAnimation`，则 ColorFilter 失效**。下面是具体分析。

# ColorFilter 的设置流程

首先从 `LottieAnimationView` 的构造方法开始。这里读取了 XML 布局文件中的 `lottie_colorFilter` 属性，包装到 `LottieValueCallback` 里面：

```java
// LottieAnimationView.java

if (ta.hasValue(R.styleable.LottieAnimationView_lottie_colorFilter)) {
    int colorRes = ta.getResourceId(R.styleable.LottieAnimationView_lottie_colorFilter, -1);
    ColorStateList csl = AppCompatResources.getColorStateList(getContext(), colorRes);
    SimpleColorFilter filter = new SimpleColorFilter(csl.getDefaultColor());
    KeyPath keyPath = new KeyPath("**");
    LottieValueCallback<ColorFilter> callback = new LottieValueCallback<>(filter);
    addValueCallback(keyPath, LottieProperty.COLOR_FILTER, callback);
}
```

最后一行 `addValueCallback`，直接调用了 `LottieDrawable` 的 `addValueCallback`：

```java
// LottieDrawable.java

public <T> void addValueCallback(final KeyPath keyPath, final T property, @Nullable final LottieValueCallback<T> callback) {
    if (compositionLayer == null) {
        lazyCompositionTasks.add(c -> addValueCallback(keyPath, property, callback));
        return;
    }
    // 调用 KeyPathElement 的 addValueCallback 设置 ColorFilter
    ...
}
```

可以看到如果 `compositionLayer` 为空，对 `addValueCallback` 的调用会被缓存到 `lazyCompositionTasks` 中。`compositionLayer` 在 `buildCompositionLayer` 中被赋值，而 `buildCompositionLayer` 在 `setComposition` 中被调用，正好这里也是处理缓存的 `lazyCompositionTasks` 的地方：

```java
// LottieDrawable.java

public boolean setComposition(LottieComposition composition) {
    ...
    // 创建 compositionLayer
    buildCompositionLayer();
    ...
    // 处理缓存的 lazyCompositionTasks
    Iterator<LazyCompositionTask> it = new ArrayList<>(lazyCompositionTasks).iterator();
    while (it.hasNext()) {
        LazyCompositionTask t = it.next();
        if (t != null) {
            t.run(composition);
        }
        it.remove();
    }
    lazyCompositionTasks.clear();
    ...
}
```

上述的分析表明，在 `LottieDrawable` 的 `setComposition` 被调用之前，将 ColorFilter 设置缓存在 `lazyCompositionTasks` 中；调用 `setComposition` 时，再将缓存的 `lazyCompositionTasks` 取出执行，因此 `setComposition` 就是一个关键方法了。那么 `setComposition` 什么时候调用呢？答案就在动画文件的加载机制中。

# 动画文件的加载

了解 Lottie 的开发者都知道，它不仅可以从 Android 的 raw 资源读取动画文件，还可以从 JSON 字符串、assets 目录或网络读取，这就涉及到一个异步加载的问题。事实上，Lottie 对于所有的动画文件，都是通过 `LottieTask` 来加载的，即便有缓存的话也是如此。如果在 XML 布局文件中指定了加载位置，则会在 `LottieAnimationView` 的构造阶段调用 `setAnimation` 触发加载。根据动画文件的加载方式，`setAnimation` 有多个重载，以 raw 资源为例：

```java
// LottieAnimationView.java

public void setAnimation(@RawRes final int rawRes) {
    ...
    setCompositionTask(fromRawRes(rawRes));
}
```

`fromRawRes` 最终会调用到 `LottieCompositionFactory` 中的同名方法：

```java
// LottieCompositionFactory.java

public static LottieTask<LottieComposition> fromRawRes(Context context, @RawRes final int rawRes, @Nullable final String cacheKey) {
    ...
    return cache(cacheKey, () -> {
        ...
        return fromRawResSync(context1, rawRes, cacheKey);
    }, null);
}

private static LottieTask<LottieComposition> cache(@Nullable final String cacheKey, Callable<LottieResult<LottieComposition>> callable, @Nullable Runnable onCached) {
    ...
    final LottieComposition cachedComposition = cacheKey == null ? null : LottieCompositionCache.getInstance().get(cacheKey);
    if (cachedComposition != null) {
        // 有缓存的情况
        task = new LottieTask<>(() -> new LottieResult<>(cachedComposition));
    }
    ...
    if (task != null) {
        ...
        return task;
    }
    // 无缓存的情况
    task = new LottieTask<>(callable);
    ...
    return task;
}
```

可以看到，无论是有缓存还是无缓存，都会把任务包装在 `Callable` 里面，用于构造一个 `LottieTask`：

```java
// LottieTask.java

public class LottieTask<T> {

    public static Executor EXECUTOR = Executors.newCachedThreadPool();
    
    public LottieTask(Callable<LottieResult<T>> runnable) {
        this(runnable, false);
    }
    
    LottieTask(Callable<LottieResult<T>> runnable, boolean runNow) {
        if (runNow) {
            // LottieAnimationView 处于 EditMode 才能走到这里
            ...
        } else {
            EXECUTOR.execute(new LottieFutureTask(runnable));
        }
    }
    ...
}
```

可以看到任务最终被包装在一个 `LottieFutureTask` 中，送入了一个线程池 `EXECUTOR` 以在子线程中执行任务。执行的代码就是上文用于构造 `LottieFutureTask` 中的 `Callable`，即：

```java
// 有缓存
() -> new LottieResult<>(cachedComposition)
// 无缓存
() -> {
    ...
    return fromRawResSync(context1, rawRes, cacheKey);
}
```

它们最终都会返回一个 `LottieResult` 对象，里面包含了加载的 `LottieComposition` 对象，即解析动画文件得到的动画数据。

下面看看 `LottieFutureTask`：

```java
// LottieTask.java

private class LottieFutureTask extends FutureTask<LottieResult<T>> {
    ...
    @Override
    protected void done() {
        ...
        try {
            setResult(get());
        } catch (InterruptedException | ExecutionException e) {
            setResult(new LottieResult<>(e));
        }
    }
}
```

`FutureTask` 是一个 Java 异步任务模型，它允许通过重写 `done` 方法获取任务结束通知，通过调用 `get` 方法获取执行结果。获取到执行结果后调用了 `setResult`：

```java
// LottieTask.java

private void setResult(@Nullable LottieResult<T> result) {
    ...
    this.result = result;
    notifyListeners();
}

private void notifyListeners() {
    // 转移到主线程执行
    handler.post(() -> {
        ...
        if (result.getValue() != null) {
            notifySuccessListeners(result.getValue());
        } else {
            notifyFailureListeners(result.getException());
        }
    });
}

private synchronized void notifySuccessListeners(T value) {
    List<LottieListener<T>> listenersCopy = new ArrayList<>(successListeners);
    for (LottieListener<T> l : listenersCopy) {
        l.onResult(value);
    }
}
```

可以看到，通过 Handler 机制将方法调用切换到主线程，然后挨个调用 `successListeners` 的 `onResult` 方法来通知。`successListeners` 通过 `addListener` 设置，它的调用点在 `LottieAnimationView` 的 `setCompositionTask`：

```java
// LottieAnimationView.java

private void setCompositionTask(LottieTask<LottieComposition> compositionTask) {
    ...
    this.compositionTask = compositionTask
        .addListener(loadedListener)
        .addFailureListener(wrappedFailureListener);
}
```

这样就回到了上文提及的 `setAnimation`，该方法中就调用了 `setCompositionTask`。

那么现在来看看 `addListener` 的参数 `loadedListener`：

```java
// LottieAnimationView.java

private final LottieListener<LottieComposition> loadedListener = new WeakSuccessListener(this);

private static class WeakSuccessListener implements LottieListener<LottieComposition> {

    private final WeakReference<LottieAnimationView> targetReference;
    
    public WeakSuccessListener(LottieAnimationView target) {
        this.targetReference = new WeakReference<>(target);
    }
    
    @Override
    public void onResult(LottieComposition result) {
        LottieAnimationView targetView = targetReference.get();
        ...
        targetView.setComposition(result);
    }
}
```

可以看到 `onResult` 中调用了 `LottieAnimationView` 的 `setComposition`：

```java
// LottieAnimationView.java

public void setComposition(@NonNull LottieComposition composition) {
    ...
    boolean isNewComposition = lottieDrawable.setComposition(composition);
    ...
}
```

这就是上文提到的 `LottieDrawable` 的 `setComposition` 的唯一调用点。

终于把动画文件的加载流程走通了，现在作一个总结：

1. 调用 `LottieAnimationView` 的 `setAnimation` 触发动画文件加载，同时设置 `LottieListener` 注册加载成功的监听器；
2. `setAnimation` 通过 `LottieCompositionFactory` 构造 `LottieTask`，送入线程池使用子线程执行异步加载；
3. 加载完成后，`LottieTask` 通过 Handler 机制，切换到主线程，通知之前设置的 `LottieListener`；
4. `LottieListener` 的 `onResult` 被调用，其中 `LottieDrawable` 的 `setComposition` 被调用。

# 问题排查

一旦 `setComposition` 被调用，缓存的 `lazyCompositionTasks` 将被处理，包括对 ColorFilter 的设置。也就是说，**如果动画文件已加载完成，就直接设置 ColorFilter；如果动画文件还未加载完成，则对 ColorFilter 的设置将被延后到动画文件加载完成**。

那么为什么上文说【如果在动画加载完成之前调用过 `LottieAnimationView` 的 `cancelAnimation` 或者 `pauseAnimation`，则 ColorFilter 失效】呢，看看 `cancelAnimation`：

```java
// LottieAnimationView.java

@MainThread
public void cancelAnimation() {
    ...
    lottieDrawable.cancelAnimation();
}
```

调用了 `LottieDrawable` 的 `cancelAnimation`：

```java
// LottieDrawable.java

public void cancelAnimation() {
    lazyCompositionTasks.clear();
    ...
}
```

原因已经显而易见，`lazyCompositionTasks` 被 `clear` 了。上文的分析已经明确，对 ColorFilter 的设置是封装在 `lazyCompositionTasks` 中的，等待动画加载完成后再来处理，而如果在动画加载完成前 `lazyCompositionTasks` 就被清空，自然就丢掉了对 ColorFilter 的设置。

事实上我认为出现这种问题的场景还是不罕见的。由上文的分析可知，动画文件的加载都会经历放到线程池里面去执行加载，再切换到主线程，在消息队列排队等待执行加载完成的回调，即便是有缓存也是这样的流程，这么一通折腾下来，加载完成的时刻就会比较靠后了。一般用例是在 XML 布局文件中指定动画资源，则会在 `LottieAnimationView` 的构造阶段触发加载，而 `View` 的实例化在 `setContentView` 期间，一般该方法是放到 Activity 的 create 阶段执行的，而根据我自己的测试，即便在有缓存的情况下，加载完成的时刻都已经在 Activity 的 resume 阶段之后了，也就是说如果在 Activity 的 create 到 resume 期间调用了 `cancelAnimation` 或 `pauseAnimation`，这个问题就能复现。

# 修复方案

我的解决方案很简单，它延后，我也延后就行了。具体来说，在动画文件加载完成之前记录对 `playAnimation`、`cancelAnimation`、`resumeAnimation`、`pauseAnimation` 四大动画操控方法的最后一次调用，等到动画文件加载完成之后再真正去调用记录的方法。那么怎么监听动画文件加载完成呢？很幸运，我在 `setComposition` 的最后找到了这么几句代码：

```java
// LottieAnimationView.java

public void setComposition(@NonNull LottieComposition composition) {
    ...
    for (LottieOnCompositionLoadedListener lottieOnCompositionLoadedListener : lottieOnCompositionLoadedListeners) {
      lottieOnCompositionLoadedListener.onCompositionLoaded(composition);
    }
}
```

看来 Lottie 是支持监听动画文件加载完成的，只需通过 `addLottieOnCompositionLoadedListener` 注册监听器即可。

下面是我的解决方案的代码：

```kt
class CustomLottieAnimationView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : LottieAnimationView(context, attrs) {

    private enum class StatusOnCompositionLoaded {
        PLAY, CANCEL, RESUME, PAUSE,
    }

    private val compositionLoaded
        get() = composition != null

    private var statusOnCompositionLoaded: StatusOnCompositionLoaded? = null

    init {
        addLottieOnCompositionLoadedListener {
            when (statusOnCompositionLoaded) {
                StatusOnCompositionLoaded.PLAY -> super.playAnimation()
                StatusOnCompositionLoaded.CANCEL -> super.cancelAnimation()
                StatusOnCompositionLoaded.RESUME -> super.resumeAnimation()
                StatusOnCompositionLoaded.PAUSE -> super.pauseAnimation()
                else -> {}
            }
            statusOnCompositionLoaded = null
        }
    }

    override fun playAnimation() {
        if (compositionLoaded) {
            super.playAnimation()
        } else {
            statusOnCompositionLoaded = StatusOnCompositionLoaded.PLAY
        }
    }

    override fun cancelAnimation() {
        if (compositionLoaded) {
            super.cancelAnimation()
        } else {
            statusOnCompositionLoaded = StatusOnCompositionLoaded.CANCEL
        }
    }

    override fun resumeAnimation() {
        if (compositionLoaded) {
            super.resumeAnimation()
        } else {
            statusOnCompositionLoaded = StatusOnCompositionLoaded.RESUME
        }
    }

    override fun pauseAnimation() {
        if (compositionLoaded) {
            super.pauseAnimation()
        } else {
            statusOnCompositionLoaded = StatusOnCompositionLoaded.PAUSE
        }
    }
}
```

新建 `CustomLottieAnimationView` 继承 `LottieAnimationView`，重写四大动画操控方法，拦截对它们的调用，若动画文件加载完成，直接调用超类的方法，否则记录到 `statusOnCompositionLoaded` 里，等待 `addLottieOnCompositionLoadedListener` 注册的监听器回调，再根据记录的 `statusOnCompositionLoaded` 调用超类的方法。由于动画文件加载完成时 `composition` 会被赋值，故通过它是否为空来判断动画文件是否加载完成。

然后，像往常使用 `LottieAnimationView` 一样使用 `CustomLottieAnimationView` 即可。

当然还可以将对 ColorFilter 的设置延迟到动画加载完成后，但目前 Lottie 没有直接开放在代码中动态设置 ColorFilter 的 API，不过或许可以把上文提到的【`LottieAnimationView` 在构造方法中读取 XML 布局文件中的 `lottie_colorFilter` 属性】的代码复制一份出来：

```java
SimpleColorFilter filter = new SimpleColorFilter(color);
KeyPath keyPath = new KeyPath("**");
LottieValueCallback<ColorFilter> callback = new LottieValueCallback<>(filter);
lottieAnimationView.addValueCallback(keyPath, LottieProperty.COLOR_FILTER, callback);
```

当然这种方法我就没测试过了。

# 后记

让我感到奇怪的是，Lottie 从我以前使用的 4.2.0 到 6.1.0，这个问题依然存在，在 GitHub 也没有找到 open 的相关 issue，按理来说一个这么出名的框架不应该有这么久都没修复的问题。不清楚是不是我的使用方式有问题，或者 ColorFilter 本就是一个没多少人用到的属性。是啊，大不了叫设计师多给几份不同颜色的动画文件，即便颜色是服务端动态下发的，那为什么不直接下发动画文件呢，反正 Lottie 也支持从网络加载。