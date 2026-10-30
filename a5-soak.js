import { journey } from './journey.js';

export const options = {
  stages: [
    { duration: '30s', target: 2 },
    { duration: '10m', target: 2 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    checks: ['rate>0.99'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  journey();
}
