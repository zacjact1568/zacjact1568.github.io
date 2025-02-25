---
title: "寻找字符串的最长回文子串"
date: "2018-09-05"
excerpt: "这个问题来自 [LeetCode](https://leetcode.com/) 的第 5 道题 [Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/description/)。在这篇文章中我将给出对两个 Accepted 算法的理解。"
---

这个问题来自 [LeetCode](https://leetcode.com/) 的第 5 道题 [Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/description/)。在这篇文章中我将给出对两个 Accepted 算法的理解。

# 原题

Given a string **s**, find the longest palindromic substring in **s**. You may assume that the maximum length of **s** is 1000.

**Example 1:**

```
Input: "babad"
Output: "bab"
Note: "aba" is also a valid answer.
```

**Example 2:**

```
Input: "cbbd"
Output: "bb"
```

# 问题描述

在一个给定的字符串 $s$ 中找出最长的回文子串。“回文”指这个字符串无论是正着看还是反着看，内容都是相同的，也就是中心对称。

# 暴力算法

## 思想

很明显，这道题可以使用暴力（Brute Force）算法解决：在 $s$ 上使用滑动窗遍历所有子串，对于每一个子串，判断其是否为回文即可。

要判断某个字符串是否为回文，首先判断其第一个字符是否与最后一个字符相等，若相等，再判断第二个字符与倒数第二个字符是否相等，以此类推。若有一次判断的结果是不相等的，说明这个字符串不对称，因此不是回文。

## 时间复杂度

设 $s$ 长度为 $n$。

首先考虑使用滑动窗遍历所有子串。每个子串的起始与结束位置决定了该子串，换句话说，每个子串由两个位置决定。而 $s$ 的长度为 $n$，即有 $n$ 个位置，那么共有 $\binom{n}{2}=\frac{n(n-1)}{2}$ 个子串。花费时间为 $O(n^2)$。

再考虑对于每个子串，判断其是否为回文。设子串长度为 $len$，则单个子串最多需比较 $\left\lfloor\frac{len}{2}\right\rfloor$ 次，而 $len$ 最大为 $n$，则对于所有子串来说，单个子串最多需比较 $\left\lfloor\frac{n}{2}\right\rfloor$ 次。花费时间为 $O(n)$。

综上，时间复杂度为 $O(n^3)$。

## 实现

使用 C++ 实现该算法。

```cpp
string findLongestPalindromicSubstring(string s) {
    // 定义找出的最长回文子串的起始与结束下标，会在遍历子串的过程中不断更新
    int start = 0, end = 0;
    // 定义当前遍历到的子串的长度与当前遍历到的最长回文子串的长度
    int len = 0, maxLen = 0;
    // 指示当前遍历到的子串是否是回文
    bool isPalindromic = false;
    // i 和 j 表示滑动窗的起始与结束下标
    for (int i = 0; i < s.size(); ++i) {
        for (int j = i; j < s.size(); ++j) {
            len = j - i + 1;
            if (len > maxLen) {
                // 只有当当前遍历到的子串长度大于上一个回文串的长度时才考虑该子串是否是回文
                for (int k = 0; k < len / 2; ++k) {
                    // 从子串的两边向中间比较
                    if (s[i + k] != s[j - k]) {
                        // 只要找到一对位置对称的字符不相等，该子串就不是回文
                        isPalindromic = false;
                        break;
                    } else if (k == len / 2 - 1) {
                        // 如果找到子串的中间位置，所有对称位置对称的字符都相等，说明该子串是回文
                        isPalindromic = true;
                    }
                }
                if (isPalindromic || len == 1) {
                    // 如果前面判断出该子串是回文，或者该子串的长度为 1，更新变量
                    // 第二种情况下不会进入前面的 for 循环，isPalindromic 为 false，但它确实是回文
                    maxLen = len;
                    start = i;
                    end = j;
                }
            }
        }
    }
    // 遍历子串结束，从 s 中截取最长回文子串并返回
    return s.substr((unsigned long) start, (unsigned long) end - start + 1);
}
```

## 提交结果

这是我的 LeetCode 提交结果：

![](/images/find-the-longest-palindromic-substring-of-a-string/brute-force.jpg)

# 动态规划算法

## 思想

暴力算法的时间复杂度还是太高了，动态规划（Dynamic Programming）算法可以把时间复杂度降低到 $O(n^2)$。

**定义子问题**

如果已知一个子串是回文，那么考虑该子串向左右各扩展一个字符的新子串，如果左右新增的两个字符相等，那么这个新子串也一定是回文，否则新子串不是回文。

**列递归关系式**

使用 $OPT(j,i)$ 表示起始和结束位置分别是 $j$ 和 $i$ 的子串是否为回文（因为后面代码里是先 $j$ 后 $i$ ），如果是，值为 $true$，否则值为 $false$。

考虑边界条件：

长度为 1 的子串是回文。

长度为 2 的子串，若其中两个字符相等，是回文。

列递归关系式如下：

$$
OPT(j,i)=
\begin{cases}
true&\text{j=i}\\\
s[j]==s[i]&\text{i-j=1}\\\
s[j]==s[i]\wedge OPT(j+1,i-1)&\text{i-j>1}
\end{cases}
$$

可见，递归关系式中包含了两个边界条件。此外，由于 $j$ 是起始位置而 $i$ 是结束位置，代码中会限制 $j\leq i$，因此就没有写 $\text{otherwise}$ 的情况。 

**使用自底向上方法求解**

动态规划算法的求解有两种，自顶向下和自底向上，前者使用递归，后者使用循环，我一般使用后者（因为算法课的考试要求就是后者🌚……）。

就以“babad”为例吧，列表如下：

|   |  b   |   a   |    b     |    a     |   d   |
|:-:|:----:|:-----:|:--------:|:--------:|:-----:|
| b | true | false | **true** |  false   | false |
| a |      | true  |  false   | **true** | false |
| b |      |       |   true   |  false   | false |
| a |      |       |          |   true   | false |
| d |      |       |          |          | true  |

由于是求最长回文子串，当然是越靠近右上角的表格对应的子串越长，于是查找表中靠近右上角并且值为 true 的表格对应的子串。如表中所示，发现 (0, 2) 和 (1, 3) 两个表格满足此要求（已标为深色），它们的长度都为 3，对应的子串分别为“bab”和“aba”，因此它们都是“babad”的最长回文子串。

## 时间复杂度

明显，整个算法的过程实际上就是在计算上面那张表，设 $s$ 长度为 $n$，则有 $n^2$ 个表格， 其中需要计算的有 $\frac{(n+1)n}{2}$ 个，因此时间复杂度为 $O(n^2)$。

## 实现

使用 C++ 实现该算法。

```cpp
string findLongestPalindromicSubstring(string s) {
    auto total = s.size();
    // 储存上面表格值的数组
    bool isPalindromic[total][total];
    int start = 0, end = 0, len = 0, maxLen = 0;
    // j 是子串的起始位置，i 是结束位置
    for (int i = 0; i < total; ++i) {
        for (int j = 0; j <= i; ++j) {
            if (j == i) {
                isPalindromic[j][i] = true;
            } else if (i - j == 1) {
                isPalindromic[j][i] = s[i] == s[j];
            } else if (i - j > 1) {
                isPalindromic[j][i] = s[i] == s[j] && isPalindromic[j + 1][i - 1];
            }
            len = i - j + 1;
            if (isPalindromic[j][i] && len > maxLen) {
                // 只有当该子串是回文，且长度大于上一个回文串的长度时才更新变量
                maxLen = len;
                start = j;
                end = i;
            }
        }
    }
    return s.substr((unsigned long) start, (unsigned long) end - start + 1);
}
```

## 提交结果

这是我的 LeetCode 提交结果：

![](/images/find-the-longest-palindromic-substring-of-a-string/dynamic-programming.jpg)

Excuse me？？？居然比暴力算法还慢，怀疑我写了个假的动态规划……

# 后记

这道题其实很早就做完了，现在还是觉得有必要记录一下，不然后面全忘了。当初做这道题的时候第一反应也是动态规划，但是不知道怎么定义子问题，就用了暴力算法😑……