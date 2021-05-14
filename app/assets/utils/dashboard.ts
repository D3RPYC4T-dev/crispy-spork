import { ILineChartMetric, IStatRangeItem } from '@assets/utils/interface';

export const DETAIL_DEFAULT_RANGE = 60 * 60 * 24 * 1000;
export const CARD_RANGE = 60 * 60 * 24 * 1000;
export const CARD_POLLING_INTERVAL = 10000 * 1000; 
export const MAX_STEP_ALLOW = 11000;
export const TIME_INTERVAL_OPTIONS =[5, 60, 600, 3600];

export const THRESHOLDS = {
  low: 60,
  medium: 90,
};

export const CARD_LOW_COLORS = 'rgba(61,209,136,1)';
export const CARD_MEDIUM_COLORS = 'rgba(245,182,13,1)';
export const CARD_HIGH_COLORS = 'rgba(230,113,113,1)';

export const getProperStep = (start: number, end: number) => {
  const hours = Math.round((end - start) / (3600 * 1000));
  if (hours <= 1) {
    return 7;
  } else if (hours <= 6) { // 6 hour
    return 86;
  } else if (hours <= 12) { // 12hour
    return 172;
  } else if (hours <= 24) { // 1 day
    return 345;
  } else if (hours <= 72) { // 3 days
    return 691;
  } else if (hours <= 168) { // 1 week
    return 2419;
  } else if (hours <= 336) { // 2 week
    return 4838;
  } else {
    return Math.round((end - start) / MAX_STEP_ALLOW);
  }
};

export const getWhichColor = value => {
  if (value < THRESHOLDS.low) {
    return CARD_LOW_COLORS;
  } else if (value < THRESHOLDS.medium) {
    return CARD_MEDIUM_COLORS;
  } else {
    return CARD_HIGH_COLORS;
  }
};

export const getProperByteDesc = bytes => {
  const kb = 1000;
  const mb = 1000 * 1000;
  const gb = mb * 1000;
  const tb = gb * 1000;
  const nt = bytes / tb;
  const ng = bytes / gb;
  const nm = bytes / mb;
  const nk = bytes / kb;
  let value = 0;
  let unit = '';

  if (nt >= 1) {
    value = Number(nt.toFixed(2));
    unit = 'TB';
  } else if (ng >= 1) {
    value = Number(ng.toFixed(2));
    unit = 'GB';
  } else if (nm >= 1) {
    value = Number(nm.toFixed(2));
    unit = 'MB';
  } else if (nk >= 1) {
    value = Number(nk.toFixed(2));
    unit = 'KB';
  } else {
    value = bytes;
    unit = 'Bytes';
  }

  return {
    value,
    unit,
    desc: value + unit,
  };
};

export const getDataByType = (payload:{data: IStatRangeItem[], type?: string, name:string}) => {
  const { name, type, data } =payload;
  const res = [] as ILineChartMetric[];
  data.forEach(instance => {
    instance.values.forEach(([timstamps, value]) => {
      if(type === 'all' || instance.metric[name] === type) {
        res.push({
          type: instance.metric[name],
          value: Number(value),
          time: timstamps,
        });
      }
    });
  });
  return res;
};

export const getProperTickInterval = (period) => {
  switch(period) {
    // past one hour
    case 24 * 60 * 60:
      return 2 * 60 * 60;
    case 60 * 60:
      return 5 * 60;
    default:
      return period < 60 * 60 ? 30 : 60 * 60 * 2;
  }
};

export const TIMEOPTIONS = [
  {
    name: '1hour',
    value: 60 * 60 * 1000,
  },
  {
    name: '6hour',
    value: 60 * 60 * 6 * 1000,
  },
  {
    name: '12hour',
    value: 60 * 60 * 12 * 1000,
  },
  {
    name: '1day',
    value: 60 * 60 * 24 * 1000,
  },
  {
    name: '3day',
    value: 60 * 60 * 24 * 3 * 1000,
  },
  {
    name: '7day',
    value: 60 * 60 * 24 * 7 * 1000,
  },
  {
    name: '14day',
    value: 60 * 60 * 24 * 14 * 1000,
  },
];
