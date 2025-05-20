import java.io.*;
import java.util.*;

public class Solution {
    /**
     * Finds the maximum subarray sum using Kadane's algorithm.
     * @param arr The input array.
     * @return The maximum sum of any contiguous subarray.
     * Time Complexity: O(n)
     * Space Complexity: O(1)
     */
    public int maxSubArraySum(int[] arr) {
        if (arr == null || arr.length == 0) {
            return 0;
        }
        
        int maxSoFar = arr[0];
        int maxEndingHere = arr[0];
        
        for (int i = 1; i < arr.length; i++) {
            // Either start a new subarray at current element
            // or extend the existing subarray
            maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);
            
            // Update the maximum sum found so far
            maxSoFar = Math.max(maxSoFar, maxEndingHere);
        }
        
        return maxSoFar;
    }
} 