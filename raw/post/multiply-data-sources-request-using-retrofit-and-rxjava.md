---
title: "通过 RxJava 实现 Retrofit 多个数据源请求"
date: "2018-02-13"
excerpt: "[Retrofit](http://square.github.io/retrofit/) 可以算是当前 Android 上最知名的网络请求库了，它和 [RxJava](https://github.com/ReactiveX/RxJava) 都活跃在各大开源 app 的依赖库清单上，毕竟它们的组合堪称完美。\r\n\r\n这篇文章介绍下怎样使用 RxJava 配合 Retrofit，实现需要等待多个数据源请求完成后，才能执行下一步操作的需求。"
---

[Retrofit](http://square.github.io/retrofit/) 可以算是当前 Android 上最知名的网络请求库了，它和 [RxJava](https://github.com/ReactiveX/RxJava) 都活跃在各大开源 app 的依赖库清单上，毕竟它们的组合堪称完美。

这篇文章介绍下怎样使用 RxJava 配合 Retrofit，实现需要等待多个数据源请求完成后，才能执行下一步操作的需求。

{# {"type": "notice", "level": "info", "content": "本文使用的编程语言为 Kotlin"} #}

# 需求

最近[和风天气](https://www.heweather.com)更新了 s6 版本，这个版本居然把常规天气数据和空气质量数据的接口给分开了，也就是说，如果想同时获取常规天气数据和空气质量数据，就得请求两次，也就意味着更新一次天气就得消耗两次访问次数，这不是坑爹吗。

所以当前的需求是，进行两次网络请求，分别获取常规天气数据和空气质量数据，然后解析数据，更新界面。

# 一般用法

使用 RxJava + Retrofit 进行网络请求并解析数据相当简单，需要引入以下依赖库：

- Retrofit
- RxJava（2.x）
- [RxAndroid](https://github.com/ReactiveX/RxAndroid)
- [Gson](https://github.com/google/gson)
- Retrofit 的 [RxJava2 Adapter](https://github.com/square/retrofit/tree/master/retrofit-adapters/rxjava2)
- Retrofit 的 [Gson Converter](https://github.com/square/retrofit/tree/master/retrofit-converters/gson)

使用 Gson Converter 的原因是，通常服务器返回的数据是 JSON 格式，Retrofit 可以使用 Gson Converter 顺带把 JSON 数据反序列化成事先定义的对象。

以和风天气 v5 接口为例，只需进行一次请求就可以得到包含空气质量数据的天气数据。请求 URL 为：

```
https://free-api.heweather.com/v5/weather?city=<城市 ID>&key=<用户认证 Key>
```

那么先添加一个 Service 接口，命名为 `HeWeatherService`，再在这个接口里写一个函数 `getHeWeatherData`，这个函数返回一个 RxJava 的 Observable 对象，其类型参数 `HeWeather` 类就是事先定义的、要将 JSON 数据反序列化成的类，它可以很方便地使用 GsonFormat 插件生成。`HeWeatherService` 接口如下所示：

```kt
interface HeWeatherService {
    @GET("weather")
    fun getHeWeatherData(@Query("city") city: String, @Query("key") key: String): Observable<HeWeather>
}
```

然后开始请求：

```kt
Retrofit.Builder()
        .baseUrl("https://free-api.heweather.com/v5/")
        .addConverterFactory(GsonConverterFactory.create())
        .addCallAdapterFactory(RxJava2CallAdapterFactory.create())
        .build()
        .create(HeWeatherService::class.java)
        .getHeWeatherData("<城市 ID>", "<用户认证 Key>")
        .subscribeOn(Schedulers.io())
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe({ <it 是请求成功的 HeWeather 对象> }, { <it 是请求失败的 Thowable 对象> })
```

全链式调用，太优雅了有没有（虽然自己很不喜欢用“优雅”这个词来形容代码）。

# 解决方案

然而，和风天气 s6 版本需要进行两个请求来获取常规天气数据和空气质量数据。请求 URL 为：

```
https://free-api.heweather.com/s6/weather?city=<城市 ID>&key=<用户认证 Key>
https://free-api.heweather.com/s6/air?city=<城市 ID>&key=<用户认证 Key>
```

那么，先定义下返回数据要反序列化成的类 `HeWeather`：

```kt
/**
 * 和风天气
 * @param common 常规天气数据
 * @param air 空气质量数据
 */
data class HeWeather(
        val common: Common?,
        val air: Air?
) {
    /** 常规天气数据 */
    data class Common...
    /** 空气质量数据 */
    data class Air...
}
```

然后，就得在 `HeWeatherService` 接口中写两个函数，分别为 `getHeWeatherCommonData` 和 `getHeWeatherAirData`，返回的 Observable 对象的参数分别是常规天气数据 `HeWeather.Common` 和空气质量数据 `HeWeather.Air`：

```kt
interface HeWeatherService {
    /** 常规天气数据 */
    @GET("weather")
    fun getHeWeatherCommonData(@Query("location") location: String, @Query("key") key: String): Observable<HeWeather.Common>
    /** 空气质量数据 */
    @GET("air")
    fun getHeWeatherAirData(@Query("location") location: String, @Query("key") key: String): Observable<HeWeather.Air>
}
```

刚开始，考虑分别发出两个请求，独立处理返回的数据，这种方法理论上是可行的，但是有点不好控制，因为并不知道哪个请求先回复，这样判断的逻辑一大堆，看到都头疼，这又不是做外包项目，只要功能实现，代码写成💩都没人管，编程也是一种艺术好不好。在网上搜了搜，找到以下选择：

- Merge 操作符：将两个 Observable 合并为一个，依次发出，只用调用一次 `subscribe` 方法。然而实际上最后会回调两次 `onNext` 方法，其参数类型分别为两个 Observable 的类型参数（e.g. 一个为 `HeWeather.Common`，另一个为 `HeWeather.Air`），需要使用 `is` 来判断，然而这跟上面那种没什么区别，排除。
- FlatMap 操作符：适用于第二个请求的参数依赖于第一个请求返回的数据（e.g. 第一个请求取 Key，第二个请求取天气信息），然而并不需要这样，感觉这比我这个需求还复杂，所以简单点的就肯定有了，排除。
- Zip 操作符：和 Merge 操作符相似，但是提供了一个函数参数，将两个请求返回的数据合并，再执行 `onNext` 方法，正好符合“两个数据源请求完成后，再执行下一步”的需求，就是它了。

看看 `Observable.zip` 的文档：

![](/images/multiply-data-sources-request-using-retrofit-and-rxjava/zip-document.jpg)

我还是第一次看到有图的文档，感觉国外开发者写文档都好认真。可以看出，`zip` 方法的第三个参数 `zipper` 是一个回调函数，其参数是请求成功后获取的两个对象，需要在函数中将这两个对象合并成一个新的对象返回。事实上，Zip 操作符可以依次合并两个 Observable 发出的多个事件，然后依次执行 `onNext` 方法。

所以，就这样用吧：

```kt
val service = Retrofit.Builder()
        .baseUrl("https://free-api.heweather.com/v5/")
        .addConverterFactory(GsonConverterFactory.create())
        .addCallAdapterFactory(RxJava2CallAdapterFactory.create())
        .build()
        .create(HeWeatherService::class.java)
Observable.zip(
        service.getHeWeatherCommonData("<城市 ID>", "<用户认证 Key>"),
        service.getHeWeatherAirData("<城市 ID>", "<用户认证 Key>"),
        BiFunction<HeWeather.Common, HeWeather.Air, HeWeather> { common, air -> HeWeather(common, air) }
)
        .subscribeOn(Schedulers.io())
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe({ <it 是请求成功的 HeWeather 对象> }, { <it 是请求失败的 Thowable 对象> })
```

在 `zip` 方法第三个函数参数中，使用获取的 `common` 和 `air` 构造 `HeWeather` 对象并返回，就可以在 `onNext` 方法中一次性拿到最终的包含常规天气数据和空气质量数据的 `HeWeather` 对象了。

# 参考资料

- [Retrofit](http://square.github.io/retrofit/)
- [ReactiveX](http://reactivex.io)

# 后记

最近想起把以前做的半途而废的天气 app 用 Kotlin 重写，发现自己以前写的代码真·不忍直视。顺便吐槽下 RxJava 的文档，像在做 GET 二卷的英译中😑……