# K6 lab results

## Part 0
- Step 0.1, http_req_duration: 217.52 ms (one request, so avg, min, med, max, p(90) and p(95) are all 217.52 ms)
- Step 0.2, requests, rate and p(95): 85 requests, 4.02 requests/s, p(95) = 217.19 ms. Why the rate stays below 5: one iteration of one virtual user is a request of about 0.22 s plus sleep(1), so about 1.22 s. One user therefore makes about 0.82 requests/s, and 5 users make about 4.1 requests/s. The sleep (think time) is most of the iteration, so the users spend most of the time waiting, not sending.
- Step 0.3 (extra note): with --iterations 20 the run made exactly 20 iterations and 20 requests in about 5.4 s (3.72 requests/s).
- Step 0.6, exit code of the normal run and of the run with P95=300: normal run exit code 0 (p(95)=326.16 ms, below 1500, all thresholds passed). With P95=300 the exit code is 99 (p(95)=330.74 ms is not below 300, so the threshold on http_req_duration was crossed).
- Step 0.7, rules that passed, p(95), p(99), exit code after my change: 07-requirement.js uses 3 users for 30 s with p(95)<1000, p(99)<1500, failed rate <1% (and checks >99%). All rules passed: p(95)=329.66 ms, p(99)=334.66 ms, exit code 0. I changed p(95)<1000 to p(95)<200 and ran it again: the p(95) rule failed (p(95)=326.99 ms, p(99)=331.45 ms), the other rules still passed, and the exit code was 99.
- Step 0.8, what was wrong, and how the checks showed it: my request wrote the names in lowercase ('pepperoni' and 'knife'), but QuickPizza spells them 'Pepperoni' and 'Knife' (explore.js printed the list of toppings and tools). The API compares the names exactly, so it ignored my exclusions and sometimes sent a pizza with pepperoni or a knife. With 5 users for 20 s the first run had checks_succeeded 85.00% (204 of 240): the status check always passed, 'no pepperoni' failed 10 of 80 times (12.5%) and 'no knife needed' failed 26 of 80 times (32.5%). After I changed the request to 'Pepperoni' and 'Knife', all 240 checks passed. The API returns one random pizza per request, so one manual request could easily have given a pizza that happened to be fine. A load test repeats the request about 80 times, so the failure rate shows up as a number, and checks that look inside the answer found it, while a check on the status code alone (always 200) would not.

## Part A results
| Step | Test type | Users | Req/s | p(95) | Max | Failed | Checks |
| ---- | ------------ | ----- | ----- | ----- | --- | ------ | ------ |
| A1 | Smoke | 1 | 0.55 | 311.32 ms | 314.44 ms | 0.00% | 100.00% |
| A2 | Average load | 3 | 1.32 | 319.69 ms | 333.85 ms | 0.00% | 100.00% |
| A3 | Stress | 5 | 2.21 | 315.69 ms | 333.45 ms | 0.00% | 100.00% |
| A4 | Spike | 5 | 1.08 | 318.78 ms | 332.97 ms | 0.00% | 100.00% |
| A5 | Soak | 2 | 1.01 | 322.97 ms | 347.87 ms | 0.00% | 100.00% |

All five runs ended with exit code 0. Every threshold passed, there were no failed requests, and all checks passed. I ran them from a GitHub Codespace, with at most 5 users (2 users for the soak test), so I followed the QuickPizza rules.

## Part B
1. The results table for Steps A1 to A5 is the table above.

2. In Step 0.2 one iteration of one virtual user is one request of about 0.22 s plus sleep(1), so about 1.22 s. One user makes about 0.82 requests per second, and 5 users make about 4.1 requests per second. I measured 4.02 requests per second. The rate stays below 5 because of the one second think time. If I removed sleep(1), each user would send about 4.6 requests per second and the rate would be much higher.

3. The response time did not grow. The p(95) was 319.69 ms in the average-load test (3 users) and 315.69 ms in the stress test (5 users), and the maximum was 333.85 ms and 333.45 ms. A difference of 4 ms is noise. The request rate did grow, from 1.32 to 2.21 requests per second, which is about 67 percent more, the same as the growth from 3 to 5 users. In terms of the operational envelope, 5 users is far inside the envelope of QuickPizza, so the test only confirms that the system keeps its promise (fast answers) at normal load and a little above it. It says nothing about where the edge is or how the system behaves beyond it. To see that, I would need a breakpoint test, which I am not allowed to run on a public site.

4. The response time did not rise during the spike, so there was nothing to recover from. The spike lasted from about 35 s to 65 s of the run. In 10 s buckets the number of requests went from 5 or 6 to 23 to 28, but the average response time stayed between 232 and 242 ms, the same range as before and after it (about 223 to 247 ms). The p(95) of each bucket stayed below 335 ms. So the return to normal took 0 seconds in my data. This only shows that 5 users is not a real spike for this site.

5. Neither got worse. In the soak test (2 users, 11 minutes) the average response time was 239.1 ms in the first minute and 239.3 ms in the last full minutes (600 to 660 s), and every one-minute average stayed between 236.6 and 249.2 ms with no upward trend. There were 0 failed requests out of 669, and 892 of 892 checks passed. A soak test of several hours could reveal a memory leak: the server keeps some memory after each request, the response time slowly grows, and in the end it fails with errors. Eleven minutes is too short to see that. Other examples are leaked database connections or file handles and a disk that fills with logs.

6. The average hides the slowest users. The p(95) is the time that 95 percent of the requests beat, so 1 request in 20 is slower. In my spike test the average was 238.94 ms but the p(95) was 318.78 ms and the maximum was 332.97 ms, so the slowest users waited about a third longer than the average suggests. A requirement written with an average would accept a system where a part of the users has a bad experience. A percentile does not hide them.

7. Two reasons: (a) The network. My requests went from a GitHub Codespace across the internet to QuickPizza, and most of the 217 ms minimum response time is the round trip, not the work of the server. A system in a lab on a local network would answer much faster. (b) Other traffic. QuickPizza is shared by everyone who practises K6, so other people's tests load the same site at the same time. Also my load generator itself (a small cloud machine) can slow down. In a lab I control the system, the network and the load, so the numbers would be different and more repeatable.

8. A stress, spike or breakpoint test with hundreds of users can slow down or crash a site, and then the real users of that site suffer, and the owner can pay for it. It looks the same as a denial-of-service attack, so without written permission it can break the rules of the site and the law, and my address can be blocked. QuickPizza is a shared demo site that Grafana offers for small tests, so one person using it heavily takes it away from everyone else.

9. Vague requirement for an app I use every day (MyCourses): "MyCourses should open fast when many students log in."
   Testable requirement: "With 200 students sending requests at the same time for 5 minutes, the course page answers 95% of requests within 1 second and 99% within 2 seconds, and fewer than 1% of requests fail."
   The K6 thresholds that check it:
   ```js
   export const options = {
     stages: [
       { duration: '1m', target: 200 },
       { duration: '5m', target: 200 },
       { duration: '1m', target: 0 },
     ],
     thresholds: {
       http_req_duration: ['p(95)<1000', 'p(99)<2000'],
       http_req_failed: ['rate<0.01'],
       checks: ['rate>0.99'],
     },
   };
   ```
   I only wrote this down and did not run it, because I do not own MyCourses (see question 8).
