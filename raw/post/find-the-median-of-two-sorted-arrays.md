---
title: "寻找两个有序数组的中位数"
date: "2018-06-24"
excerpt: "这个问题来自 [LeetCode](https://leetcode.com) 的第 4 道题 [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/description/)。在这篇文章中我将给出对某个 Accepted 算法的理解。"
---

这个问题来自 [LeetCode](https://leetcode.com) 的第 4 道题 [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/description/)。在这篇文章中我将给出对某个 Accepted 算法的理解。

# 原题

There are two sorted arrays **nums1** and **nums2** of size m and n respectively.

Find the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).

**Example 1:**

```
nums1 = [1, 3]
nums2 = [2]

The median is 2.0
```

**Example 2:**

```
nums1 = [1, 2]
nums2 = [3, 4]

The median is (2 + 3)/2 = 2.5
```

# 问题描述

给定两个升序排序的数组 $M$ 、 $N$，它们分别有 $m$ 、 $n$ 个元素，寻找这两个数组中所有数的中位数，时间复杂度要求为 $O(\log(m+n))$。

设两个数组总元素个数为 $L$，则 $L$ 个数的中位数就是将这些数按序排列（升序或降序均可），如果 $L$ 为奇数，中位数是排序后的第 $\left\lceil\frac{L}{2}\right\rceil$ 个数；如果 $L$ 为偶数，中位数是排序后的第 $\frac{L}{2}$ 个数与第 $\frac{L}{2}+1$ 个数的均值。也就是说，一系列数中，比中位数小的数的个数与比中位数大的数的个数相等。

看起来就很简单了，将这两个有序数组合并，然后再根据合并后的数组元素个数是奇数还是偶数，直接取特定位置的元素即可。然而这样的话，合并两个有序数组的时间复杂度达到了 $O(m+n)$，显然是不满足要求的，所以，还需要另找算法。

# 算法

## 思想

分析中位数的定义可知，当 $L$ 为奇数时，求中位数实际上就是求它们中第 $\left\lceil\frac{L}{2}\right\rceil$ 小的元素；当 $L$ 为偶数时，求中位数实际上就是求它们中第 $\frac{L}{2}$ 小的数与第 $\frac{L}{2}+1$ 小的数，然后求均值即可。

于是，先定义合并后数组中的“中位数相关数”：当 $L$ 为奇数时，中位数相关数为第 $\left\lceil\frac{L}{2}\right\rceil$ 小的元素；当 $L$ 为偶数时，中位数相关数为第 $\frac{L}{2}$ 小的数与第 $\frac{L}{2}+1$ 小的数。因为，知道了这些数就可以立即求出中位数。

因此，可以使用从两个数组中逐渐删除一些不可能是中位数相关元素的方式，设两个数组元素升序排列，删除的都是小于这些数的元素。

如果能成功找到这样的数，设第 $i$ 次在某个数组中删除小于中位数相关数的某个元素，由于两个数组都是升序的，那么也就可以删除该元素之前的所有 $d_i$ 个元素，每次迭代就可以减少 $d_i$ 个元素，而如果 $d_i$ 又是与 $L$ 相关的话，肯定经过 $log$ 时间就能把小于中位数相关数的元素删除完，那么，就可以找到中位数相关数了。当然，这只是算法的一个大体思路。

现在考虑怎样寻找每次迭代要删除的元素。定义一个子程序，用来寻找两个升序排序的数组中第 $k$ 小的元素 $S_k$，主程序调用这个子程序来得出结果。这个子程序接收两个升序数组 $A$ 、 $B$ 和 $k$ 作为参数。明显，首次调用该子程序输入的 $A$ 、 $B$ 就是 $M$ 、 $N$，当 $L$ 为奇数，$k$ 为 $\left\lceil\frac{L}{2}\right\rceil$ ；当 $L$ 为偶数，调用两次子程序，$k$ 分别为 $\frac{L}{2}$ 和 $\frac{L}{2}+1$。

在子程序中，比较 $A$ 、 $B$ 第 $\left\lfloor\frac{k}{2}\right\rfloor$ 项元素 $A_k$ 、 $B_k$ ，找出较小的那个，设为 $D_k$，那么 $D_k$ 及其前面的所有元素都可以被从其所在的数组中删除，因为这些数肯定是小于 $S_k$ 的，下面进行证明。

当 $k$ 为奇数时，两个数组前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项共有 $k-1$ 个数；当 $k$ 为偶数时，两个数组前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项共有 $k$ 个数，也就是说，两个数组前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项至少有 $k-1$ 个元素。由于 $A_k$ 、 $B_k$ 中较小的那个元素 $D_k$ 最大也只能是两个数组前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项元素中次大的元素了，因此， $D_k$ 肯定是小于 $S_k$ 的，又由于数组升序排列， $D_k$ 前面的元素比它还小，因此，可以将 $D_k$ 及其前面的所有元素从对应数组中删除，即删除对应数组前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项元素。

这样就完成了一次迭代，删除了某个数组前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项元素，这些元素肯定是比 $S_k$ 小的。接下来，再求剩下的两个数组中第 $k-\left\lfloor\frac{k}{2}\right\rfloor$ 小的元素即可，也就是递归调用子程序。这样，每次迭代减少了 $\left\lfloor\frac{k}{2}\right\rfloor$ 个元素。

那么，如果某一次迭代，某个数组已经不足 $\left\lfloor\frac{k}{2}\right\rfloor$ 项了怎么办呢？这种情况下， $D_k$ 直接取另一个数组第 $\left\lfloor\frac{k}{2}\right\rfloor$ 项元素即可，下面进行证明。

设 $A$ 不足 $\left\lfloor\frac{k}{2}\right\rfloor$ 项。若 $S_k$ 在 $A$ 中，则 $B$ 的前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项元素肯定是小于 $S_k$ 的，因为一旦有大于等于 $S_k$ 的元素， $B$ 升序排列，则 $B$ 中该元素后面的元素都是大于 $S_k$ 的了，就算 $A$ 中最大的（最后一个）元素是 $S_k$，两个数组中所有小于 $S_k$ 的元素也不足 $k$ 了，这与 $S_k$ 是两个数组中第 $k$ 小的元素矛盾。若 $S_k$ 在 $B$ 中，则 $B$ 的前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项元素也肯定是小于 $S_k$ 的，也就是说 $S_k$ 一定不在 $B$ 的前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项中，因为如果 $S_k$ 在 $B$ 的前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项中，那么 $B$ 的前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项中就有大于等于 $S_k$ 的元素，同上，有矛盾。综上所述，若 $A$ 不足 $\left\lfloor\frac{k}{2}\right\rfloor$ 项，则 $B$ 的前 $\left\lfloor\frac{k}{2}\right\rfloor$ 项元素总是是小于 $S_k$ 的，可以删除这些元素，也就是说 $D_k$ 直接取 $B$ 第 $\left\lfloor\frac{k}{2}\right\rfloor$ 项元素即可。

接下来考虑结束递归的情况。当其中一个数组为空，则另一个数组第 $k$ 个元素就是 $S_k$。当 $k$ 为 1，则求两个数组中最小的元素，由于两个数组升序排列，则两个数组第一个元素较小的那个就是 $S_k$。

## 时间复杂度

{# {"type": "notice", "level": "warning", "content": "这段可能有细节上的错误！"} #}

由以上分析可知，子程序算法的递归式是 $T(k)=T(k-\left\lfloor\frac{k}{2}\right\rfloor)$，在算法分析中， $\left\lfloor\frac{k}{2}\right\rfloor$ 实际上就可以看成是 $\frac{k}{2}$，那么，递归式就可以写成 $T(k)=T(\frac{k}{2})+O(1)$，根据主方法，时间复杂度是 $O(\log k)$。由于在主程序算法开始的时候，根据 $L$ 是奇数还是偶数来决定 $k$，$k$ 大体等于 $\frac{L}{2}$，如果 $L$ 是奇数，调用一次子程序，如果 $L$ 是偶数，调用两次子程序。总的说来，主程序算法的时间复杂度就是 $O(\log L)$，即 $O(\log(m+n))$。

# 实现

使用 C++ 实现该算法。

首先编写用来寻找两个升序数组中第 $k$ 小元素的子程序，将该子程序定义在函数 `findKthSmallestNum` 中。该函数有 5 个参数，除了两个升序数组 `nums1` 和 `nums2`，以及 `k` 之外，还有两个数组的起始位置 `start1` 和 `start2`。因为每次迭代要删除其中一个数组的前一部分元素，使用两个起始位置来指定每次迭代在两个数组中开始的元素，就不用真的去删除元素了，也就是说，每次递归调用该函数，传入的 `nums1` 和 `nums2` 都是一样的，只是 `start1` 或 `start2` 在增长。

```cpp
double findKthSmallestNum(vector<int> &nums1, int start1, vector<int> &nums2, int start2, int k) {
    auto len1 = nums1.size();
    auto len2 = nums2.size();
    if (start1 >= len1) {
        // 如果数组 A 为空，则数组 B 第 k 个元素就是两个数组中第 k 小的元素
        return nums2[start2 + k - 1];
    }
    if (start2 >= len2) {
        // 如果数组 B 为空，则数组 A 第 k 个元素就是两个数组中第 k 小的元素
        return nums1[start1 + k - 1];
    }
    if (k == 1) {
        // 如果 k 为 1，则两个数组第一个元素较小的那个就是两个数组中第 k 小的元素
        return min(nums1[start1], nums2[start2]);
    }
    // 两个数组第 ⌊k/2⌋ 项元素的下标
    int index1 = start1 + k / 2 - 1;
    int index2 = start2 + k / 2 - 1;
    // 两个数组第 ⌊k/2⌋ 项元素
    int num1, num2;
    if (index1 < len1) {
        // 如果数组 A 有 ⌊k/2⌋ 项，则将该元素赋值给 num1
        num1 = nums1[index1];
    } else {
        // 如果数组 A 已经不足 ⌊k/2⌋ 项，则“删除”数组 B 前 ⌊k/2⌋ 项元素，即将 start2 增加 ⌊k/2⌋，再递归调用该函数，求两个“新”数组中第 k - ⌊k/2⌋ 小的元素
        return findKthSmallestNum(nums1, start1, nums2, start2 + k / 2, k - k / 2);
    }
    if (index2 < len2) {
        // 如果数组 B 有 ⌊k/2⌋ 项，则将该元素赋值给 num2
        num2 = nums2[index2];
    } else {
        // 如果数组 B 已经不足 ⌊k/2⌋ 项，则“删除”数组 A 前 ⌊k/2⌋ 项元素，即将 start1 增加 ⌊k/2⌋，再递归调用该函数，求两个“新”数组中第 k - ⌊k/2⌋ 小的元素
        return findKthSmallestNum(nums1, start1 + k / 2, nums2, start2, k - k / 2);
    }
    if (num1 < num2) {
        // 如果数组 A 第 ⌊k/2⌋ 项元素较小，“删除” 数组 A 前 ⌊k/2⌋ 项元素，即将 start1 增加 ⌊k/2⌋，再递归调用该函数，求两个“新”数组中第 k - ⌊k/2⌋ 小的元素
        return findKthSmallestNum(nums1, start1 + k / 2, nums2, start2, k - k / 2);
    } else {
        // 如果数组 B 第 ⌊k/2⌋ 项元素较小，“删除” 数组 B 前 ⌊k/2⌋ 项元素，即将 start2 增加 ⌊k/2⌋，再递归调用该函数，求两个“新”数组中第 k - ⌊k/2⌋ 小的元素
        return findKthSmallestNum(nums1, start1, nums2, start2 + k / 2, k - k / 2);
    }
}
```

然后，再编写主程序，将该主程序定义在函数 `findMedianSortedArrays` 中。

```cpp
double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
    // 两个数组的元素总数
    auto len = nums1.size() + nums2.size();
    double result;
    if (len % 2 == 0) {
        // len 为偶数，中位数为两个数组中第 len/2 小的元素和第 len/2 + 1 小的元素的均值
        result = (findKthSmallestNum(nums1, 0, nums2, 0, (int) len / 2) + findKthSmallestNum(nums1, 0, nums2, 0, (int) len / 2 + 1)) / 2;
    } else {
        // len 为奇数，中位数为两个数组中第 ⌈len/2⌉ 小的元素
        result = findKthSmallestNum(nums1, 0, nums2, 0, (int) len / 2 + 1);
    }
    return result;
}
```

# 提交结果

这是我的 LeetCode 提交结果：

![](/images/find-the-median-of-two-sorted-arrays/submission-detail.jpg)

Emmmm……很一般的样子。

# 参考资料

- [九章算法 | Uber 面试题 : 两个排序数组的的中位数](https://zhuanlan.zhihu.com/p/33168674)

# 后记

这道题做了我好久，实在是想不出时间复杂度为 $O(\log(m+n))$ 的算法了，智商不够用……其实，看到有 $log$ 的时间复杂度，首先就想到了肯定可以用递归，但是具体怎么用，真想不出来。后来在网上找了个算法，然后考虑每一步为什么要这样做又花了我好多时间……把算法学好还有很长的路要走啊。