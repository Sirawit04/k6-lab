# K6 lab results

## Part 0
- Step 0.1, http_req_duration: 217.52 ms (one request, so avg, min, med, max, p(90) and p(95) are all 217.52 ms)
- Step 0.2, requests, rate and p(95): 85 requests, 4.02 requests/s, p(95) = 217.19 ms. Why the rate stays below 5: one iteration of one virtual user is a request of about 0.22 s plus sleep(1), so about 1.22 s. One user therefore makes about 0.82 requests/s, and 5 users make about 4.1 requests/s. The sleep (think time) is most of the iteration, so the users spend most of the time waiting, not sending.
- Step 0.3 (extra note): with --iterations 20 the run made exactly 20 iterations and 20 requests in about 5.4 s (3.72 requests/s).
- Step 0.6, exit code of the normal run and of the run with P95=300: normal run exit code 0 (p(95)=326.16 ms, below 1500, all thresholds passed). With P95=300 the exit code is 99 (p(95)=330.74 ms is not below 300, so the threshold on http_req_duration was crossed).
