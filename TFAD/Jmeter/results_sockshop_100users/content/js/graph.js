/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
$(document).ready(function() {

    $(".click-title").mouseenter( function(    e){
        e.preventDefault();
        this.style.cursor="pointer";
    });
    $(".click-title").mousedown( function(event){
        event.preventDefault();
    });

    // Ugly code while this script is shared among several pages
    try{
        refreshHitsPerSecond(true);
    } catch(e){}
    try{
        refreshResponseTimeOverTime(true);
    } catch(e){}
    try{
        refreshResponseTimePercentiles();
    } catch(e){}
});


var responseTimePercentilesInfos = {
        data: {"result": {"minY": 2.0, "minX": 0.0, "maxY": 14681.0, "series": [{"data": [[0.0, 2.0], [0.1, 2.0], [0.2, 3.0], [0.3, 3.0], [0.4, 3.0], [0.5, 3.0], [0.6, 3.0], [0.7, 3.0], [0.8, 3.0], [0.9, 4.0], [1.0, 4.0], [1.1, 4.0], [1.2, 4.0], [1.3, 4.0], [1.4, 4.0], [1.5, 4.0], [1.6, 4.0], [1.7, 4.0], [1.8, 4.0], [1.9, 4.0], [2.0, 4.0], [2.1, 4.0], [2.2, 4.0], [2.3, 4.0], [2.4, 4.0], [2.5, 4.0], [2.6, 4.0], [2.7, 4.0], [2.8, 5.0], [2.9, 5.0], [3.0, 5.0], [3.1, 5.0], [3.2, 5.0], [3.3, 5.0], [3.4, 5.0], [3.5, 5.0], [3.6, 5.0], [3.7, 5.0], [3.8, 5.0], [3.9, 5.0], [4.0, 5.0], [4.1, 5.0], [4.2, 5.0], [4.3, 5.0], [4.4, 5.0], [4.5, 5.0], [4.6, 6.0], [4.7, 6.0], [4.8, 6.0], [4.9, 6.0], [5.0, 6.0], [5.1, 6.0], [5.2, 7.0], [5.3, 7.0], [5.4, 7.0], [5.5, 7.0], [5.6, 7.0], [5.7, 7.0], [5.8, 7.0], [5.9, 7.0], [6.0, 7.0], [6.1, 8.0], [6.2, 8.0], [6.3, 8.0], [6.4, 8.0], [6.5, 8.0], [6.6, 8.0], [6.7, 8.0], [6.8, 8.0], [6.9, 8.0], [7.0, 8.0], [7.1, 8.0], [7.2, 8.0], [7.3, 9.0], [7.4, 9.0], [7.5, 9.0], [7.6, 9.0], [7.7, 9.0], [7.8, 9.0], [7.9, 9.0], [8.0, 9.0], [8.1, 9.0], [8.2, 9.0], [8.3, 9.0], [8.4, 9.0], [8.5, 10.0], [8.6, 10.0], [8.7, 10.0], [8.8, 10.0], [8.9, 10.0], [9.0, 11.0], [9.1, 11.0], [9.2, 11.0], [9.3, 12.0], [9.4, 12.0], [9.5, 13.0], [9.6, 13.0], [9.7, 13.0], [9.8, 13.0], [9.9, 14.0], [10.0, 16.0], [10.1, 17.0], [10.2, 17.0], [10.3, 19.0], [10.4, 20.0], [10.5, 20.0], [10.6, 21.0], [10.7, 21.0], [10.8, 22.0], [10.9, 22.0], [11.0, 23.0], [11.1, 23.0], [11.2, 23.0], [11.3, 25.0], [11.4, 27.0], [11.5, 30.0], [11.6, 32.0], [11.7, 33.0], [11.8, 34.0], [11.9, 34.0], [12.0, 42.0], [12.1, 42.0], [12.2, 43.0], [12.3, 43.0], [12.4, 43.0], [12.5, 43.0], [12.6, 43.0], [12.7, 43.0], [12.8, 43.0], [12.9, 43.0], [13.0, 43.0], [13.1, 43.0], [13.2, 43.0], [13.3, 43.0], [13.4, 43.0], [13.5, 43.0], [13.6, 43.0], [13.7, 43.0], [13.8, 43.0], [13.9, 43.0], [14.0, 43.0], [14.1, 44.0], [14.2, 44.0], [14.3, 44.0], [14.4, 44.0], [14.5, 44.0], [14.6, 44.0], [14.7, 44.0], [14.8, 44.0], [14.9, 44.0], [15.0, 44.0], [15.1, 44.0], [15.2, 44.0], [15.3, 44.0], [15.4, 44.0], [15.5, 44.0], [15.6, 44.0], [15.7, 44.0], [15.8, 44.0], [15.9, 44.0], [16.0, 44.0], [16.1, 44.0], [16.2, 44.0], [16.3, 44.0], [16.4, 44.0], [16.5, 44.0], [16.6, 44.0], [16.7, 44.0], [16.8, 44.0], [16.9, 44.0], [17.0, 44.0], [17.1, 44.0], [17.2, 44.0], [17.3, 44.0], [17.4, 44.0], [17.5, 44.0], [17.6, 44.0], [17.7, 44.0], [17.8, 44.0], [17.9, 45.0], [18.0, 45.0], [18.1, 45.0], [18.2, 45.0], [18.3, 45.0], [18.4, 45.0], [18.5, 45.0], [18.6, 45.0], [18.7, 45.0], [18.8, 45.0], [18.9, 45.0], [19.0, 45.0], [19.1, 45.0], [19.2, 45.0], [19.3, 45.0], [19.4, 45.0], [19.5, 45.0], [19.6, 45.0], [19.7, 45.0], [19.8, 45.0], [19.9, 45.0], [20.0, 45.0], [20.1, 45.0], [20.2, 45.0], [20.3, 45.0], [20.4, 45.0], [20.5, 45.0], [20.6, 45.0], [20.7, 45.0], [20.8, 45.0], [20.9, 45.0], [21.0, 45.0], [21.1, 45.0], [21.2, 45.0], [21.3, 45.0], [21.4, 45.0], [21.5, 45.0], [21.6, 45.0], [21.7, 45.0], [21.8, 45.0], [21.9, 45.0], [22.0, 45.0], [22.1, 45.0], [22.2, 45.0], [22.3, 45.0], [22.4, 45.0], [22.5, 45.0], [22.6, 45.0], [22.7, 45.0], [22.8, 45.0], [22.9, 46.0], [23.0, 46.0], [23.1, 46.0], [23.2, 46.0], [23.3, 46.0], [23.4, 46.0], [23.5, 46.0], [23.6, 46.0], [23.7, 46.0], [23.8, 46.0], [23.9, 46.0], [24.0, 46.0], [24.1, 46.0], [24.2, 46.0], [24.3, 46.0], [24.4, 46.0], [24.5, 46.0], [24.6, 46.0], [24.7, 46.0], [24.8, 46.0], [24.9, 46.0], [25.0, 46.0], [25.1, 46.0], [25.2, 46.0], [25.3, 46.0], [25.4, 46.0], [25.5, 46.0], [25.6, 47.0], [25.7, 47.0], [25.8, 47.0], [25.9, 47.0], [26.0, 47.0], [26.1, 47.0], [26.2, 47.0], [26.3, 47.0], [26.4, 47.0], [26.5, 47.0], [26.6, 47.0], [26.7, 47.0], [26.8, 47.0], [26.9, 47.0], [27.0, 47.0], [27.1, 48.0], [27.2, 48.0], [27.3, 48.0], [27.4, 48.0], [27.5, 48.0], [27.6, 48.0], [27.7, 49.0], [27.8, 49.0], [27.9, 50.0], [28.0, 51.0], [28.1, 52.0], [28.2, 73.0], [28.3, 74.0], [28.4, 75.0], [28.5, 75.0], [28.6, 76.0], [28.7, 76.0], [28.8, 76.0], [28.9, 76.0], [29.0, 79.0], [29.1, 79.0], [29.2, 80.0], [29.3, 81.0], [29.4, 81.0], [29.5, 81.0], [29.6, 82.0], [29.7, 82.0], [29.8, 84.0], [29.9, 84.0], [30.0, 84.0], [30.1, 85.0], [30.2, 85.0], [30.3, 88.0], [30.4, 89.0], [30.5, 89.0], [30.6, 90.0], [30.7, 90.0], [30.8, 91.0], [30.9, 91.0], [31.0, 91.0], [31.1, 92.0], [31.2, 93.0], [31.3, 93.0], [31.4, 93.0], [31.5, 94.0], [31.6, 95.0], [31.7, 95.0], [31.8, 96.0], [31.9, 96.0], [32.0, 96.0], [32.1, 97.0], [32.2, 97.0], [32.3, 97.0], [32.4, 97.0], [32.5, 97.0], [32.6, 97.0], [32.7, 97.0], [32.8, 97.0], [32.9, 97.0], [33.0, 98.0], [33.1, 98.0], [33.2, 98.0], [33.3, 98.0], [33.4, 98.0], [33.5, 98.0], [33.6, 98.0], [33.7, 98.0], [33.8, 98.0], [33.9, 99.0], [34.0, 99.0], [34.1, 99.0], [34.2, 99.0], [34.3, 100.0], [34.4, 100.0], [34.5, 100.0], [34.6, 100.0], [34.7, 100.0], [34.8, 100.0], [34.9, 100.0], [35.0, 100.0], [35.1, 100.0], [35.2, 101.0], [35.3, 101.0], [35.4, 101.0], [35.5, 102.0], [35.6, 102.0], [35.7, 102.0], [35.8, 102.0], [35.9, 102.0], [36.0, 102.0], [36.1, 102.0], [36.2, 103.0], [36.3, 103.0], [36.4, 103.0], [36.5, 103.0], [36.6, 103.0], [36.7, 103.0], [36.8, 103.0], [36.9, 103.0], [37.0, 103.0], [37.1, 103.0], [37.2, 103.0], [37.3, 103.0], [37.4, 103.0], [37.5, 103.0], [37.6, 103.0], [37.7, 103.0], [37.8, 104.0], [37.9, 104.0], [38.0, 104.0], [38.1, 104.0], [38.2, 104.0], [38.3, 104.0], [38.4, 104.0], [38.5, 104.0], [38.6, 104.0], [38.7, 104.0], [38.8, 104.0], [38.9, 104.0], [39.0, 104.0], [39.1, 104.0], [39.2, 104.0], [39.3, 104.0], [39.4, 104.0], [39.5, 104.0], [39.6, 104.0], [39.7, 104.0], [39.8, 104.0], [39.9, 104.0], [40.0, 105.0], [40.1, 105.0], [40.2, 105.0], [40.3, 105.0], [40.4, 105.0], [40.5, 105.0], [40.6, 105.0], [40.7, 105.0], [40.8, 105.0], [40.9, 105.0], [41.0, 105.0], [41.1, 105.0], [41.2, 105.0], [41.3, 105.0], [41.4, 105.0], [41.5, 105.0], [41.6, 105.0], [41.7, 105.0], [41.8, 105.0], [41.9, 105.0], [42.0, 105.0], [42.1, 105.0], [42.2, 105.0], [42.3, 105.0], [42.4, 105.0], [42.5, 105.0], [42.6, 106.0], [42.7, 106.0], [42.8, 106.0], [42.9, 106.0], [43.0, 106.0], [43.1, 106.0], [43.2, 106.0], [43.3, 106.0], [43.4, 106.0], [43.5, 106.0], [43.6, 106.0], [43.7, 106.0], [43.8, 106.0], [43.9, 106.0], [44.0, 106.0], [44.1, 106.0], [44.2, 106.0], [44.3, 106.0], [44.4, 106.0], [44.5, 106.0], [44.6, 106.0], [44.7, 106.0], [44.8, 106.0], [44.9, 106.0], [45.0, 107.0], [45.1, 107.0], [45.2, 107.0], [45.3, 107.0], [45.4, 107.0], [45.5, 107.0], [45.6, 107.0], [45.7, 107.0], [45.8, 107.0], [45.9, 107.0], [46.0, 107.0], [46.1, 108.0], [46.2, 108.0], [46.3, 108.0], [46.4, 108.0], [46.5, 108.0], [46.6, 108.0], [46.7, 108.0], [46.8, 108.0], [46.9, 108.0], [47.0, 108.0], [47.1, 108.0], [47.2, 108.0], [47.3, 109.0], [47.4, 109.0], [47.5, 109.0], [47.6, 109.0], [47.7, 109.0], [47.8, 109.0], [47.9, 109.0], [48.0, 109.0], [48.1, 109.0], [48.2, 109.0], [48.3, 109.0], [48.4, 109.0], [48.5, 109.0], [48.6, 110.0], [48.7, 110.0], [48.8, 110.0], [48.9, 110.0], [49.0, 110.0], [49.1, 110.0], [49.2, 110.0], [49.3, 110.0], [49.4, 110.0], [49.5, 110.0], [49.6, 110.0], [49.7, 110.0], [49.8, 110.0], [49.9, 110.0], [50.0, 111.0], [50.1, 111.0], [50.2, 111.0], [50.3, 111.0], [50.4, 111.0], [50.5, 111.0], [50.6, 111.0], [50.7, 111.0], [50.8, 111.0], [50.9, 111.0], [51.0, 111.0], [51.1, 111.0], [51.2, 111.0], [51.3, 111.0], [51.4, 112.0], [51.5, 112.0], [51.6, 112.0], [51.7, 112.0], [51.8, 112.0], [51.9, 112.0], [52.0, 112.0], [52.1, 112.0], [52.2, 112.0], [52.3, 112.0], [52.4, 112.0], [52.5, 112.0], [52.6, 113.0], [52.7, 113.0], [52.8, 113.0], [52.9, 113.0], [53.0, 113.0], [53.1, 113.0], [53.2, 113.0], [53.3, 113.0], [53.4, 113.0], [53.5, 114.0], [53.6, 114.0], [53.7, 114.0], [53.8, 114.0], [53.9, 114.0], [54.0, 114.0], [54.1, 114.0], [54.2, 115.0], [54.3, 115.0], [54.4, 116.0], [54.5, 116.0], [54.6, 116.0], [54.7, 116.0], [54.8, 116.0], [54.9, 117.0], [55.0, 117.0], [55.1, 117.0], [55.2, 117.0], [55.3, 117.0], [55.4, 118.0], [55.5, 118.0], [55.6, 119.0], [55.7, 119.0], [55.8, 119.0], [55.9, 119.0], [56.0, 119.0], [56.1, 120.0], [56.2, 120.0], [56.3, 120.0], [56.4, 120.0], [56.5, 120.0], [56.6, 121.0], [56.7, 125.0], [56.8, 129.0], [56.9, 138.0], [57.0, 145.0], [57.1, 149.0], [57.2, 155.0], [57.3, 158.0], [57.4, 159.0], [57.5, 159.0], [57.6, 160.0], [57.7, 175.0], [57.8, 175.0], [57.9, 176.0], [58.0, 176.0], [58.1, 176.0], [58.2, 176.0], [58.3, 176.0], [58.4, 176.0], [58.5, 177.0], [58.6, 177.0], [58.7, 178.0], [58.8, 178.0], [58.9, 178.0], [59.0, 179.0], [59.1, 179.0], [59.2, 179.0], [59.3, 179.0], [59.4, 179.0], [59.5, 179.0], [59.6, 180.0], [59.7, 180.0], [59.8, 180.0], [59.9, 180.0], [60.0, 180.0], [60.1, 180.0], [60.2, 180.0], [60.3, 180.0], [60.4, 181.0], [60.5, 181.0], [60.6, 181.0], [60.7, 181.0], [60.8, 181.0], [60.9, 182.0], [61.0, 182.0], [61.1, 182.0], [61.2, 182.0], [61.3, 182.0], [61.4, 183.0], [61.5, 183.0], [61.6, 183.0], [61.7, 184.0], [61.8, 184.0], [61.9, 184.0], [62.0, 184.0], [62.1, 184.0], [62.2, 184.0], [62.3, 185.0], [62.4, 185.0], [62.5, 185.0], [62.6, 185.0], [62.7, 185.0], [62.8, 185.0], [62.9, 185.0], [63.0, 185.0], [63.1, 186.0], [63.2, 186.0], [63.3, 186.0], [63.4, 186.0], [63.5, 186.0], [63.6, 186.0], [63.7, 187.0], [63.8, 187.0], [63.9, 187.0], [64.0, 188.0], [64.1, 188.0], [64.2, 188.0], [64.3, 188.0], [64.4, 188.0], [64.5, 188.0], [64.6, 188.0], [64.7, 188.0], [64.8, 188.0], [64.9, 189.0], [65.0, 189.0], [65.1, 189.0], [65.2, 189.0], [65.3, 189.0], [65.4, 189.0], [65.5, 189.0], [65.6, 189.0], [65.7, 189.0], [65.8, 189.0], [65.9, 189.0], [66.0, 189.0], [66.1, 190.0], [66.2, 190.0], [66.3, 190.0], [66.4, 190.0], [66.5, 190.0], [66.6, 190.0], [66.7, 190.0], [66.8, 190.0], [66.9, 190.0], [67.0, 190.0], [67.1, 190.0], [67.2, 190.0], [67.3, 190.0], [67.4, 190.0], [67.5, 190.0], [67.6, 191.0], [67.7, 191.0], [67.8, 191.0], [67.9, 191.0], [68.0, 191.0], [68.1, 191.0], [68.2, 191.0], [68.3, 191.0], [68.4, 191.0], [68.5, 191.0], [68.6, 191.0], [68.7, 191.0], [68.8, 191.0], [68.9, 191.0], [69.0, 191.0], [69.1, 191.0], [69.2, 192.0], [69.3, 192.0], [69.4, 192.0], [69.5, 192.0], [69.6, 192.0], [69.7, 192.0], [69.8, 192.0], [69.9, 192.0], [70.0, 192.0], [70.1, 192.0], [70.2, 192.0], [70.3, 192.0], [70.4, 192.0], [70.5, 192.0], [70.6, 192.0], [70.7, 192.0], [70.8, 192.0], [70.9, 192.0], [71.0, 192.0], [71.1, 193.0], [71.2, 193.0], [71.3, 193.0], [71.4, 193.0], [71.5, 193.0], [71.6, 193.0], [71.7, 193.0], [71.8, 193.0], [71.9, 193.0], [72.0, 193.0], [72.1, 193.0], [72.2, 193.0], [72.3, 193.0], [72.4, 193.0], [72.5, 193.0], [72.6, 194.0], [72.7, 194.0], [72.8, 194.0], [72.9, 194.0], [73.0, 194.0], [73.1, 194.0], [73.2, 194.0], [73.3, 194.0], [73.4, 194.0], [73.5, 194.0], [73.6, 194.0], [73.7, 194.0], [73.8, 194.0], [73.9, 194.0], [74.0, 194.0], [74.1, 194.0], [74.2, 194.0], [74.3, 194.0], [74.4, 194.0], [74.5, 194.0], [74.6, 195.0], [74.7, 195.0], [74.8, 195.0], [74.9, 195.0], [75.0, 195.0], [75.1, 195.0], [75.2, 195.0], [75.3, 195.0], [75.4, 195.0], [75.5, 195.0], [75.6, 195.0], [75.7, 196.0], [75.8, 196.0], [75.9, 196.0], [76.0, 196.0], [76.1, 196.0], [76.2, 196.0], [76.3, 196.0], [76.4, 196.0], [76.5, 197.0], [76.6, 197.0], [76.7, 198.0], [76.8, 198.0], [76.9, 198.0], [77.0, 198.0], [77.1, 198.0], [77.2, 198.0], [77.3, 198.0], [77.4, 198.0], [77.5, 198.0], [77.6, 199.0], [77.7, 199.0], [77.8, 199.0], [77.9, 199.0], [78.0, 199.0], [78.1, 199.0], [78.2, 199.0], [78.3, 199.0], [78.4, 199.0], [78.5, 199.0], [78.6, 199.0], [78.7, 200.0], [78.8, 200.0], [78.9, 200.0], [79.0, 200.0], [79.1, 200.0], [79.2, 200.0], [79.3, 200.0], [79.4, 200.0], [79.5, 200.0], [79.6, 200.0], [79.7, 201.0], [79.8, 201.0], [79.9, 201.0], [80.0, 201.0], [80.1, 201.0], [80.2, 202.0], [80.3, 202.0], [80.4, 203.0], [80.5, 203.0], [80.6, 203.0], [80.7, 203.0], [80.8, 204.0], [80.9, 204.0], [81.0, 204.0], [81.1, 204.0], [81.2, 205.0], [81.3, 205.0], [81.4, 206.0], [81.5, 206.0], [81.6, 207.0], [81.7, 208.0], [81.8, 208.0], [81.9, 208.0], [82.0, 208.0], [82.1, 209.0], [82.2, 209.0], [82.3, 209.0], [82.4, 209.0], [82.5, 209.0], [82.6, 209.0], [82.7, 209.0], [82.8, 210.0], [82.9, 210.0], [83.0, 210.0], [83.1, 210.0], [83.2, 210.0], [83.3, 211.0], [83.4, 211.0], [83.5, 211.0], [83.6, 211.0], [83.7, 211.0], [83.8, 211.0], [83.9, 212.0], [84.0, 212.0], [84.1, 212.0], [84.2, 213.0], [84.3, 214.0], [84.4, 214.0], [84.5, 214.0], [84.6, 214.0], [84.7, 215.0], [84.8, 215.0], [84.9, 215.0], [85.0, 215.0], [85.1, 215.0], [85.2, 216.0], [85.3, 216.0], [85.4, 219.0], [85.5, 220.0], [85.6, 221.0], [85.7, 222.0], [85.8, 222.0], [85.9, 227.0], [86.0, 228.0], [86.1, 235.0], [86.2, 237.0], [86.3, 245.0], [86.4, 250.0], [86.5, 259.0], [86.6, 275.0], [86.7, 277.0], [86.8, 278.0], [86.9, 279.0], [87.0, 280.0], [87.1, 281.0], [87.2, 281.0], [87.3, 281.0], [87.4, 282.0], [87.5, 285.0], [87.6, 285.0], [87.7, 286.0], [87.8, 286.0], [87.9, 287.0], [88.0, 287.0], [88.1, 287.0], [88.2, 287.0], [88.3, 287.0], [88.4, 287.0], [88.5, 287.0], [88.6, 288.0], [88.7, 288.0], [88.8, 288.0], [88.9, 290.0], [89.0, 290.0], [89.1, 291.0], [89.2, 292.0], [89.3, 292.0], [89.4, 292.0], [89.5, 293.0], [89.6, 293.0], [89.7, 293.0], [89.8, 294.0], [89.9, 294.0], [90.0, 295.0], [90.1, 295.0], [90.2, 296.0], [90.3, 296.0], [90.4, 297.0], [90.5, 297.0], [90.6, 298.0], [90.7, 301.0], [90.8, 302.0], [90.9, 303.0], [91.0, 303.0], [91.1, 304.0], [91.2, 305.0], [91.3, 305.0], [91.4, 308.0], [91.5, 310.0], [91.6, 310.0], [91.7, 310.0], [91.8, 313.0], [91.9, 314.0], [92.0, 314.0], [92.1, 314.0], [92.2, 316.0], [92.3, 320.0], [92.4, 349.0], [92.5, 352.0], [92.6, 357.0], [92.7, 369.0], [92.8, 369.0], [92.9, 370.0], [93.0, 371.0], [93.1, 372.0], [93.2, 373.0], [93.3, 374.0], [93.4, 375.0], [93.5, 378.0], [93.6, 379.0], [93.7, 383.0], [93.8, 384.0], [93.9, 384.0], [94.0, 385.0], [94.1, 385.0], [94.2, 385.0], [94.3, 385.0], [94.4, 386.0], [94.5, 386.0], [94.6, 386.0], [94.7, 387.0], [94.8, 387.0], [94.9, 388.0], [95.0, 389.0], [95.1, 390.0], [95.2, 390.0], [95.3, 391.0], [95.4, 391.0], [95.5, 392.0], [95.6, 393.0], [95.7, 396.0], [95.8, 398.0], [95.9, 400.0], [96.0, 400.0], [96.1, 401.0], [96.2, 401.0], [96.3, 401.0], [96.4, 402.0], [96.5, 402.0], [96.6, 402.0], [96.7, 405.0], [96.8, 405.0], [96.9, 407.0], [97.0, 418.0], [97.1, 420.0], [97.2, 432.0], [97.3, 485.0], [97.4, 492.0], [97.5, 495.0], [97.6, 746.0], [97.7, 977.0], [97.8, 978.0], [97.9, 980.0], [98.0, 1052.0], [98.1, 1343.0], [98.2, 1918.0], [98.3, 2817.0], [98.4, 3714.0], [98.5, 4792.0], [98.6, 5514.0], [98.7, 6413.0], [98.8, 7312.0], [98.9, 8212.0], [99.0, 9107.0], [99.1, 9999.0], [99.2, 10900.0], [99.3, 11800.0], [99.4, 12696.0], [99.5, 13597.0], [99.6, 13804.0], [99.7, 13804.0], [99.8, 13894.0], [99.9, 14193.0]], "isOverall": false, "label": "HTTP Request", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 100.0, "title": "Response Time Percentiles"}},
        getOptions: function() {
            return {
                series: {
                    points: { show: false }
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentiles'
                },
                xaxis: {
                    tickDecimals: 1,
                    axisLabel: "Percentiles",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Percentile value in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : %x.2 percentile was %y ms"
                },
                selection: { mode: "xy" },
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentiles"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesPercentiles"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesPercentiles"), dataset, prepareOverviewOptions(options));
        }
};

/**
 * @param elementId Id of element where we display message
 */
function setEmptyGraph(elementId) {
    $(function() {
        $(elementId).text("No graph series with filter="+seriesFilter);
    });
}

// Response times percentiles
function refreshResponseTimePercentiles() {
    var infos = responseTimePercentilesInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimePercentiles");
        return;
    }
    if (isGraph($("#flotResponseTimesPercentiles"))){
        infos.createGraph();
    } else {
        var choiceContainer = $("#choicesResponseTimePercentiles");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesPercentiles", "#overviewResponseTimesPercentiles");
        $('#bodyResponseTimePercentiles .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimeDistributionInfos = {
        data: {"result": {"minY": 1.0, "minX": 0.0, "maxY": 1333.0, "series": [{"data": [[0.0, 1028.0], [600.0, 2.0], [700.0, 1.0], [800.0, 1.0], [900.0, 9.0], [1000.0, 2.0], [1100.0, 1.0], [1300.0, 2.0], [1600.0, 2.0], [1900.0, 1.0], [2200.0, 1.0], [2600.0, 1.0], [2800.0, 1.0], [3100.0, 1.0], [3400.0, 1.0], [3700.0, 1.0], [4000.0, 1.0], [4300.0, 1.0], [4700.0, 1.0], [4900.0, 1.0], [5200.0, 1.0], [5500.0, 1.0], [5800.0, 1.0], [6100.0, 1.0], [6400.0, 1.0], [6800.0, 1.0], [7000.0, 1.0], [7300.0, 1.0], [7600.0, 1.0], [7900.0, 1.0], [8500.0, 1.0], [8200.0, 1.0], [9100.0, 1.0], [8900.0, 1.0], [9700.0, 1.0], [9400.0, 1.0], [9900.0, 1.0], [10200.0, 1.0], [10700.0, 1.0], [11100.0, 1.0], [10900.0, 1.0], [11400.0, 1.0], [12000.0, 1.0], [11800.0, 1.0], [12600.0, 1.0], [12300.0, 1.0], [13200.0, 2.0], [13800.0, 9.0], [13500.0, 1.0], [14100.0, 3.0], [14600.0, 2.0], [100.0, 1333.0], [200.0, 359.0], [300.0, 157.0], [400.0, 49.0]], "isOverall": false, "label": "HTTP Request", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 100, "maxX": 14600.0, "title": "Response Time Distribution"}},
        getOptions: function() {
            var granularity = this.data.result.granularity;
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    barWidth: this.data.result.granularity
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " responses for " + label + " were between " + xval + " and " + (xval + granularity) + " ms";
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimeDistribution"), prepareData(data.result.series, $("#choicesResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshResponseTimeDistribution() {
    var infos = responseTimeDistributionInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeDistribution");
        return;
    }
    if (isGraph($("#flotResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var syntheticResponseTimeDistributionInfos = {
        data: {"result": {"minY": 18.0, "minX": 0.0, "ticks": [[0, "Requests having \nresponse time <= 500ms"], [1, "Requests having \nresponse time > 500ms and <= 1,500ms"], [2, "Requests having \nresponse time > 1,500ms"], [3, "Requests in error"]], "maxY": 2926.0, "series": [{"data": [[0.0, 2926.0]], "color": "#9ACD32", "isOverall": false, "label": "Requests having \nresponse time <= 500ms", "isController": false}, {"data": [[1.0, 18.0]], "color": "yellow", "isOverall": false, "label": "Requests having \nresponse time > 500ms and <= 1,500ms", "isController": false}, {"data": [[2.0, 56.0]], "color": "orange", "isOverall": false, "label": "Requests having \nresponse time > 1,500ms", "isController": false}, {"data": [], "color": "#FF6347", "isOverall": false, "label": "Requests in error", "isController": false}], "supportsControllersDiscrimination": false, "maxX": 2.0, "title": "Synthetic Response Times Distribution"}},
        getOptions: function() {
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendSyntheticResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times ranges",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                    tickLength:0,
                    min:-0.5,
                    max:3.5
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    align: "center",
                    barWidth: 0.25,
                    fill:.75
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " " + label;
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            options.xaxis.ticks = data.result.ticks;
            $.plot($("#flotSyntheticResponseTimeDistribution"), prepareData(data.result.series, $("#choicesSyntheticResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshSyntheticResponseTimeDistribution() {
    var infos = syntheticResponseTimeDistributionInfos;
    prepareSeries(infos.data, true);
    if (isGraph($("#flotSyntheticResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerSyntheticResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var activeThreadsOverTimeInfos = {
        data: {"result": {"minY": 14.49275362318841, "minX": 1.78088802E12, "maxY": 47.18355510064829, "series": [{"data": [[1.78088808E12, 47.18355510064829], [1.78088802E12, 14.49275362318841]], "isOverall": false, "label": "Thread Group", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.78088808E12, "title": "Active Threads Over Time"}},
        getOptions: function() {
            return {
                series: {
                    stack: true,
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 6,
                    show: true,
                    container: '#legendActiveThreadsOverTime'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                selection: {
                    mode: 'xy'
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : At %x there were %y active threads"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesActiveThreadsOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotActiveThreadsOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewActiveThreadsOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Active Threads Over Time
function refreshActiveThreadsOverTime(fixTimestamps) {
    var infos = activeThreadsOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 28800000);
    }
    if(isGraph($("#flotActiveThreadsOverTime"))) {
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesActiveThreadsOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotActiveThreadsOverTime", "#overviewActiveThreadsOverTime");
        $('#footerActiveThreadsOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var timeVsThreadsInfos = {
        data: {"result": {"minY": 12.5, "minX": 1.0, "maxY": 14635.0, "series": [{"data": [[2.0, 39.5], [3.0, 38.19634703196348], [4.0, 33.01612903225806], [5.0, 38.50000000000001], [6.0, 500.8181818181818], [7.0, 125.50000000000001], [8.0, 108.75], [9.0, 59.857142857142875], [10.0, 200.0], [11.0, 135.7777777777778], [12.0, 33.384615384615394], [13.0, 66.78571428571428], [14.0, 16.22222222222222], [15.0, 41.36170212765957], [16.0, 47.45238095238094], [17.0, 48.66666666666667], [18.0, 12.5], [19.0, 27.916666666666668], [21.0, 88.0], [23.0, 89.0], [24.0, 100.61538461538461], [26.0, 93.33333333333333], [27.0, 175.0], [28.0, 92.0], [30.0, 99.66666666666667], [31.0, 99.0], [33.0, 106.16666666666667], [32.0, 99.0], [35.0, 104.0], [37.0, 104.0], [36.0, 104.0], [38.0, 105.5], [41.0, 106.0], [40.0, 106.0], [43.0, 104.0], [44.0, 104.33333333333333], [47.0, 104.0], [48.0, 125.75], [53.0, 105.0], [55.0, 149.37499999999997], [54.0, 140.5], [57.0, 6988.111111111109], [59.0, 14635.0], [60.0, 6692.854545454545], [61.0, 594.4833333333331], [62.0, 157.52499999999998], [63.0, 201.04347826086953], [64.0, 296.0693069306929], [65.0, 151.7868852459016], [66.0, 137.01874999999998], [67.0, 150.16431924882625], [68.0, 158.41843971631212], [69.0, 209.38489208633106], [70.0, 234.5895522388059], [71.0, 179.9166666666667], [72.0, 201.28378378378378], [1.0, 35.22222222222222]], "isOverall": false, "label": "HTTP Request", "isController": false}, {"data": [[46.43166666666661, 309.6486666666673]], "isOverall": false, "label": "HTTP Request-Aggregated", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 72.0, "title": "Time VS Threads"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: { noColumns: 2,show: true, container: '#legendTimeVsThreads' },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s: At %x.2 active threads, Average response time was %y.2 ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesTimeVsThreads"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotTimesVsThreads"), dataset, options);
            // setup overview
            $.plot($("#overviewTimesVsThreads"), dataset, prepareOverviewOptions(options));
        }
};

// Time vs threads
function refreshTimeVsThreads(){
    var infos = timeVsThreadsInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTimeVsThreads");
        return;
    }
    if(isGraph($("#flotTimesVsThreads"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTimeVsThreads");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTimesVsThreads", "#overviewTimesVsThreads");
        $('#footerTimeVsThreads .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var bytesThroughputOverTimeInfos = {
        data : {"result": {"minY": 194.35, "minX": 1.78088802E12, "maxY": 520741.0, "series": [{"data": [[1.78088808E12, 520741.0], [1.78088802E12, 12259.0]], "isOverall": false, "label": "Bytes received per second", "isController": false}, {"data": [[1.78088808E12, 8255.65], [1.78088802E12, 194.35]], "isOverall": false, "label": "Bytes sent per second", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.78088808E12, "title": "Bytes Throughput Over Time"}},
        getOptions : function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity) ,
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Bytes / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendBytesThroughputOverTime'
                },
                selection: {
                    mode: "xy"
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y"
                }
            };
        },
        createGraph : function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesBytesThroughputOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotBytesThroughputOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewBytesThroughputOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Bytes throughput Over Time
function refreshBytesThroughputOverTime(fixTimestamps) {
    var infos = bytesThroughputOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 28800000);
    }
    if(isGraph($("#flotBytesThroughputOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesBytesThroughputOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotBytesThroughputOverTime", "#overviewBytesThroughputOverTime");
        $('#footerBytesThroughputOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimesOverTimeInfos = {
        data: {"result": {"minY": 268.71920846127523, "minX": 1.78088802E12, "maxY": 2048.2608695652175, "series": [{"data": [[1.78088808E12, 268.71920846127523], [1.78088802E12, 2048.2608695652175]], "isOverall": false, "label": "HTTP Request", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.78088808E12, "title": "Response Time Over Time"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average response time was %y ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Times Over Time
function refreshResponseTimeOverTime(fixTimestamps) {
    var infos = responseTimesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 28800000);
    }
    if(isGraph($("#flotResponseTimesOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesOverTime", "#overviewResponseTimesOverTime");
        $('#footerResponseTimesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var latenciesOverTimeInfos = {
        data: {"result": {"minY": 262.7802797679959, "minX": 1.78088802E12, "maxY": 2046.608695652174, "series": [{"data": [[1.78088808E12, 262.7802797679959], [1.78088802E12, 2046.608695652174]], "isOverall": false, "label": "HTTP Request", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.78088808E12, "title": "Latencies Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response latencies in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendLatenciesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average latency was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesLatenciesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotLatenciesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewLatenciesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Latencies Over Time
function refreshLatenciesOverTime(fixTimestamps) {
    var infos = latenciesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyLatenciesOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 28800000);
    }
    if(isGraph($("#flotLatenciesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesLatenciesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotLatenciesOverTime", "#overviewLatenciesOverTime");
        $('#footerLatenciesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var connectTimeOverTimeInfos = {
        data: {"result": {"minY": 0.06721255544182879, "minX": 1.78088802E12, "maxY": 0.40579710144927555, "series": [{"data": [[1.78088808E12, 0.06721255544182879], [1.78088802E12, 0.40579710144927555]], "isOverall": false, "label": "HTTP Request", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.78088808E12, "title": "Connect Time Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getConnectTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average Connect Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendConnectTimeOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average connect time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesConnectTimeOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotConnectTimeOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewConnectTimeOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Connect Time Over Time
function refreshConnectTimeOverTime(fixTimestamps) {
    var infos = connectTimeOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyConnectTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 28800000);
    }
    if(isGraph($("#flotConnectTimeOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesConnectTimeOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotConnectTimeOverTime", "#overviewConnectTimeOverTime");
        $('#footerConnectTimeOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var responseTimePercentilesOverTimeInfos = {
        data: {"result": {"minY": 2.0, "minX": 1.78088802E12, "maxY": 14681.0, "series": [{"data": [[1.78088808E12, 14681.0], [1.78088802E12, 14112.0]], "isOverall": false, "label": "Max", "isController": false}, {"data": [[1.78088808E12, 2.0], [1.78088802E12, 45.0]], "isOverall": false, "label": "Min", "isController": false}, {"data": [[1.78088808E12, 292.0], [1.78088802E12, 13804.0]], "isOverall": false, "label": "90th percentile", "isController": false}, {"data": [[1.78088808E12, 6739.399999999921], [1.78088802E12, 14112.0]], "isOverall": false, "label": "99th percentile", "isController": false}, {"data": [[1.78088808E12, 110.0], [1.78088802E12, 185.0]], "isOverall": false, "label": "Median", "isController": false}, {"data": [[1.78088808E12, 386.0], [1.78088802E12, 13804.0]], "isOverall": false, "label": "95th percentile", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.78088808E12, "title": "Response Time Percentiles Over Time (successful requests only)"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Response Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentilesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Response time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentilesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimePercentilesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimePercentilesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Time Percentiles Over Time
function refreshResponseTimePercentilesOverTime(fixTimestamps) {
    var infos = responseTimePercentilesOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 28800000);
    }
    if(isGraph($("#flotResponseTimePercentilesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimePercentilesOverTime", "#overviewResponseTimePercentilesOverTime");
        $('#footerResponseTimePercentilesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var responseTimeVsRequestInfos = {
    data: {"result": {"minY": 10.0, "minX": 1.0, "maxY": 13804.0, "series": [{"data": [[9.0, 13804.0], [42.0, 176.0], [13.0, 44.0], [231.0, 234.0], [229.0, 10.0], [1.0, 815.0], [264.0, 194.0], [17.0, 200.0], [72.0, 44.0], [314.0, 197.5], [334.0, 198.0], [91.0, 45.0], [95.0, 44.0], [101.0, 44.0], [106.0, 44.0], [108.0, 44.0], [463.0, 112.0], [510.0, 105.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 510.0, "title": "Response Time Vs Request"}},
    getOptions: function() {
        return {
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Response Time in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: {
                noColumns: 2,
                show: true,
                container: '#legendResponseTimeVsRequest'
            },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median response time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesResponseTimeVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotResponseTimeVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewResponseTimeVsRequest"), dataset, prepareOverviewOptions(options));

    }
};

// Response Time vs Request
function refreshResponseTimeVsRequest() {
    var infos = responseTimeVsRequestInfos;
    prepareSeries(infos.data);
    if (isGraph($("#flotResponseTimeVsRequest"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeVsRequest");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimeVsRequest", "#overviewResponseTimeVsRequest");
        $('#footerResponseRimeVsRequest .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var latenciesVsRequestInfos = {
    data: {"result": {"minY": 4.0, "minX": 1.0, "maxY": 13804.0, "series": [{"data": [[9.0, 13804.0], [42.0, 176.0], [13.0, 4.0], [231.0, 215.0], [229.0, 9.0], [1.0, 815.0], [264.0, 192.0], [17.0, 199.0], [72.0, 44.0], [314.0, 190.0], [334.0, 195.0], [91.0, 45.0], [95.0, 44.0], [101.0, 43.0], [106.0, 43.0], [108.0, 43.0], [463.0, 110.0], [510.0, 105.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 510.0, "title": "Latencies Vs Request"}},
    getOptions: function() {
        return{
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Latency in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: { noColumns: 2,show: true, container: '#legendLatencyVsRequest' },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median Latency time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesLatencyVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotLatenciesVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewLatenciesVsRequest"), dataset, prepareOverviewOptions(options));
    }
};

// Latencies vs Request
function refreshLatenciesVsRequest() {
        var infos = latenciesVsRequestInfos;
        prepareSeries(infos.data);
        if(isGraph($("#flotLatenciesVsRequest"))){
            infos.createGraph();
        }else{
            var choiceContainer = $("#choicesLatencyVsRequest");
            createLegend(choiceContainer, infos);
            infos.createGraph();
            setGraphZoomable("#flotLatenciesVsRequest", "#overviewLatenciesVsRequest");
            $('#footerLatenciesVsRequest .legendColorBox > div').each(function(i){
                $(this).clone().prependTo(choiceContainer.find("li").eq(i));
            });
        }
};

var hitsPerSecondInfos = {
        data: {"result": {"minY": 2.1333333333333333, "minX": 1.78088802E12, "maxY": 47.86666666666667, "series": [{"data": [[1.78088808E12, 47.86666666666667], [1.78088802E12, 2.1333333333333333]], "isOverall": false, "label": "hitsPerSecond", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.78088808E12, "title": "Hits Per Second"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of hits / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendHitsPerSecond"
                },
                selection: {
                    mode : 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y.2 hits/sec"
                }
            };
        },
        createGraph: function createGraph() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesHitsPerSecond"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotHitsPerSecond"), dataset, options);
            // setup overview
            $.plot($("#overviewHitsPerSecond"), dataset, prepareOverviewOptions(options));
        }
};

// Hits per second
function refreshHitsPerSecond(fixTimestamps) {
    var infos = hitsPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 28800000);
    }
    if (isGraph($("#flotHitsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesHitsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotHitsPerSecond", "#overviewHitsPerSecond");
        $('#footerHitsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var codesPerSecondInfos = {
        data: {"result": {"minY": 1.15, "minX": 1.78088802E12, "maxY": 48.85, "series": [{"data": [[1.78088808E12, 48.85], [1.78088802E12, 1.15]], "isOverall": false, "label": "200", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.78088808E12, "title": "Codes Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendCodesPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "Number of Response Codes %s at %x was %y.2 responses / sec"
                }
            };
        },
    createGraph: function() {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesCodesPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotCodesPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewCodesPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Codes per second
function refreshCodesPerSecond(fixTimestamps) {
    var infos = codesPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 28800000);
    }
    if(isGraph($("#flotCodesPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesCodesPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotCodesPerSecond", "#overviewCodesPerSecond");
        $('#footerCodesPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var transactionsPerSecondInfos = {
        data: {"result": {"minY": 1.15, "minX": 1.78088802E12, "maxY": 48.85, "series": [{"data": [[1.78088808E12, 48.85], [1.78088802E12, 1.15]], "isOverall": false, "label": "HTTP Request-success", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.78088808E12, "title": "Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTransactionsPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                }
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTransactionsPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTransactionsPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewTransactionsPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Transactions per second
function refreshTransactionsPerSecond(fixTimestamps) {
    var infos = transactionsPerSecondInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTransactionsPerSecond");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 28800000);
    }
    if(isGraph($("#flotTransactionsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTransactionsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTransactionsPerSecond", "#overviewTransactionsPerSecond");
        $('#footerTransactionsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var totalTPSInfos = {
        data: {"result": {"minY": 1.15, "minX": 1.78088802E12, "maxY": 48.85, "series": [{"data": [[1.78088808E12, 48.85], [1.78088802E12, 1.15]], "isOverall": false, "label": "Transaction-success", "isController": false}, {"data": [], "isOverall": false, "label": "Transaction-failure", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.78088808E12, "title": "Total Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTotalTPS"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                },
                colors: ["#9ACD32", "#FF6347"]
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTotalTPS"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTotalTPS"), dataset, options);
        // setup overview
        $.plot($("#overviewTotalTPS"), dataset, prepareOverviewOptions(options));
    }
};

// Total Transactions per second
function refreshTotalTPS(fixTimestamps) {
    var infos = totalTPSInfos;
    // We want to ignore seriesFilter
    prepareSeries(infos.data, false, true);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 28800000);
    }
    if(isGraph($("#flotTotalTPS"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTotalTPS");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTotalTPS", "#overviewTotalTPS");
        $('#footerTotalTPS .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

// Collapse the graph matching the specified DOM element depending the collapsed
// status
function collapse(elem, collapsed){
    if(collapsed){
        $(elem).parent().find(".fa-chevron-up").removeClass("fa-chevron-up").addClass("fa-chevron-down");
    } else {
        $(elem).parent().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-up");
        if (elem.id == "bodyBytesThroughputOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshBytesThroughputOverTime(true);
            }
            document.location.href="#bytesThroughputOverTime";
        } else if (elem.id == "bodyLatenciesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesOverTime(true);
            }
            document.location.href="#latenciesOverTime";
        } else if (elem.id == "bodyCustomGraph") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCustomGraph(true);
            }
            document.location.href="#responseCustomGraph";
        } else if (elem.id == "bodyConnectTimeOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshConnectTimeOverTime(true);
            }
            document.location.href="#connectTimeOverTime";
        } else if (elem.id == "bodyResponseTimePercentilesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimePercentilesOverTime(true);
            }
            document.location.href="#responseTimePercentilesOverTime";
        } else if (elem.id == "bodyResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeDistribution();
            }
            document.location.href="#responseTimeDistribution" ;
        } else if (elem.id == "bodySyntheticResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshSyntheticResponseTimeDistribution();
            }
            document.location.href="#syntheticResponseTimeDistribution" ;
        } else if (elem.id == "bodyActiveThreadsOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshActiveThreadsOverTime(true);
            }
            document.location.href="#activeThreadsOverTime";
        } else if (elem.id == "bodyTimeVsThreads") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTimeVsThreads();
            }
            document.location.href="#timeVsThreads" ;
        } else if (elem.id == "bodyCodesPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCodesPerSecond(true);
            }
            document.location.href="#codesPerSecond";
        } else if (elem.id == "bodyTransactionsPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTransactionsPerSecond(true);
            }
            document.location.href="#transactionsPerSecond";
        } else if (elem.id == "bodyTotalTPS") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTotalTPS(true);
            }
            document.location.href="#totalTPS";
        } else if (elem.id == "bodyResponseTimeVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeVsRequest();
            }
            document.location.href="#responseTimeVsRequest";
        } else if (elem.id == "bodyLatenciesVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesVsRequest();
            }
            document.location.href="#latencyVsRequest";
        }
    }
}

/*
 * Activates or deactivates all series of the specified graph (represented by id parameter)
 * depending on checked argument.
 */
function toggleAll(id, checked){
    var placeholder = document.getElementById(id);

    var cases = $(placeholder).find(':checkbox');
    cases.prop('checked', checked);
    $(cases).parent().children().children().toggleClass("legend-disabled", !checked);

    var choiceContainer;
    if ( id == "choicesBytesThroughputOverTime"){
        choiceContainer = $("#choicesBytesThroughputOverTime");
        refreshBytesThroughputOverTime(false);
    } else if(id == "choicesResponseTimesOverTime"){
        choiceContainer = $("#choicesResponseTimesOverTime");
        refreshResponseTimeOverTime(false);
    }else if(id == "choicesResponseCustomGraph"){
        choiceContainer = $("#choicesResponseCustomGraph");
        refreshCustomGraph(false);
    } else if ( id == "choicesLatenciesOverTime"){
        choiceContainer = $("#choicesLatenciesOverTime");
        refreshLatenciesOverTime(false);
    } else if ( id == "choicesConnectTimeOverTime"){
        choiceContainer = $("#choicesConnectTimeOverTime");
        refreshConnectTimeOverTime(false);
    } else if ( id == "choicesResponseTimePercentilesOverTime"){
        choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        refreshResponseTimePercentilesOverTime(false);
    } else if ( id == "choicesResponseTimePercentiles"){
        choiceContainer = $("#choicesResponseTimePercentiles");
        refreshResponseTimePercentiles();
    } else if(id == "choicesActiveThreadsOverTime"){
        choiceContainer = $("#choicesActiveThreadsOverTime");
        refreshActiveThreadsOverTime(false);
    } else if ( id == "choicesTimeVsThreads"){
        choiceContainer = $("#choicesTimeVsThreads");
        refreshTimeVsThreads();
    } else if ( id == "choicesSyntheticResponseTimeDistribution"){
        choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        refreshSyntheticResponseTimeDistribution();
    } else if ( id == "choicesResponseTimeDistribution"){
        choiceContainer = $("#choicesResponseTimeDistribution");
        refreshResponseTimeDistribution();
    } else if ( id == "choicesHitsPerSecond"){
        choiceContainer = $("#choicesHitsPerSecond");
        refreshHitsPerSecond(false);
    } else if(id == "choicesCodesPerSecond"){
        choiceContainer = $("#choicesCodesPerSecond");
        refreshCodesPerSecond(false);
    } else if ( id == "choicesTransactionsPerSecond"){
        choiceContainer = $("#choicesTransactionsPerSecond");
        refreshTransactionsPerSecond(false);
    } else if ( id == "choicesTotalTPS"){
        choiceContainer = $("#choicesTotalTPS");
        refreshTotalTPS(false);
    } else if ( id == "choicesResponseTimeVsRequest"){
        choiceContainer = $("#choicesResponseTimeVsRequest");
        refreshResponseTimeVsRequest();
    } else if ( id == "choicesLatencyVsRequest"){
        choiceContainer = $("#choicesLatencyVsRequest");
        refreshLatenciesVsRequest();
    }
    var color = checked ? "black" : "#818181";
    if(choiceContainer != null) {
        choiceContainer.find("label").each(function(){
            this.style.color = color;
        });
    }
}

