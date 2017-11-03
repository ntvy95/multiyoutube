# multiyoutube
Maybe this one can be counted as a tool to mashup? Though its original intent is for educational purpose.

# Interpretations of variables

<table>
  <tr><th>Variable</th><th>Default value</th><th>Units</th></tr>
  <tr><td>start</td><td>An array of 0</td><td>Second</td></tr>
  <tr><td>end</td><td>An array of Infinity</td><td>Second</td></tr>
  <tr><td>current</td><td>0</td><td>Second</td></tr>
</table>

Each element of the array `start` and `end` is used to specify the interval of the respective video you want to play within.

The variable `current` is used to save your watching progress.

# Example

https://ntvy95.github.io/multiyoutube/#!?youtube=q0LILXfwhdk,9UUPEo849_s&start=40,2&end=59.25732426303855,22.561&current=10

Let's break down the above URL:

<table>
  <tr><th>youtube</th><th>start</th><th>end</th><th>current</th></tr>
  <tr><td>q0LILXfwhdk</td><td>40</td><td>59.25732426303855</td><td rowspan="2">10</td></tr>
  <tr><td>9UUPEo849_s</td><td>2</td><td>22.561</td></tr>
</table>

The first time you click `Play` button, the two youtube videos q0LILXfwhdk and 9UUPEo849_s will be played, starts from the second 40+10 and 2+10, respectively and ends at the second 59.25732426303855 and 22.561, respectively.

If you click `Stop` button, the two videos will be ready to play starting from the second 40 and 20, respectively.

In `Stop` mode (before you click the `Play` button for the first time and right after you click the `Stop` button), you are able to adjust the variable `start` by tuning time slider of each video. There is no way to adjust the variable `end` on the website, you have to manually set it for your self as I do not think the usage of `end` is common.

You can use the `Get URL` button to save and share your combination (in `youtube`, `start`, `end`) along with your watching progress (in `current`).

For the purpose of sharing, you may want to manually delete the part `&current=10` from the retrieved URL.
