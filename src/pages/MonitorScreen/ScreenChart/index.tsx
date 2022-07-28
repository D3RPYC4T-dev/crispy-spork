import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from 'react';
import _ from 'loadsh';

import { getDataByType } from '@base/utils/dashboard';
import { IRootState, IDispatch } from '@ent/store';
import { BIG_SCREEN_SCREEN_METRICS } from '@base/utils/promQL';
import { BIGSCREE_DEFAULT_RANGE } from '@base/utils/service';
import { connect } from 'react-redux';
import AreaChart from '../AreaChart';

import styles from './index.module.less';

const mapState = (state: IRootState) => ({
  cluster: state.cluster.cluster,
  aliasConfig: state.app.aliasConfig,
});

const mapDispatch: any = (dispatch: IDispatch) => ({
  asyncGetMetricsData: dispatch.service.asyncGetMetricsData,
});

interface Props {
  aliasConfig: any;
  color?: string;
  metricType: string;
  asyncGetMetricsData?: any;
  cluster?: any;
}

const ScreenChart = forwardRef((props: Props, ref: any) => {
  const {
    asyncGetMetricsData,
    cluster,
    aliasConfig,
    color = '#37cbff',
    metricType,
  } = props;

  const timerRef = useRef<any>(null);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const metricItem = useMemo(
    () => BIG_SCREEN_SCREEN_METRICS.find(item => item.metric === metricType),
    [],
  );

  useEffect(() => {
    if (cluster.id) {
      pollingData();
    }
  }, [cluster]);

  const [data, setData] = useState<any>([]);

  const asyncFetchMetricsData = async () => {
    const metricItem = BIG_SCREEN_SCREEN_METRICS.find(
      item => item.metric === metricType,
    );
    if (!metricItem) return;
    const end = Date.now();
    const curMetricyType: any = metricItem.metricType;
    const query =
      typeof curMetricyType.value === 'function'
        ? curMetricyType.value(cluster.id)
        : curMetricyType.value + curMetricyType.period;
    const data = await asyncGetMetricsData({
      query, // EXPLAIN: query like nebula_graphd_num_queries_rate_600
      start: end - BIGSCREE_DEFAULT_RANGE,
      end,
      clusterID: cluster.id,
      noSuffix: typeof curMetricyType.value === 'function',
    });
    const finData = getDataByType({
      data,
      type: 'all',
      name: metricItem.instanceKey,
      aliasConfig,
    }).map(t => {
      t.time *= 1000;
      if (metricItem.yValues?.fn) {
        const { fn } = metricItem.yValues;
        t.value = fn(t.value);
      }
      return t;
    });
    setData(finData);
  };

  useImperativeHandle(ref, () => ({
    getLatestValue: () => data[data.length - 1],
  }));

  const pollingData = async () => {
    if (cluster.id) {
      asyncFetchMetricsData();
    }
    timerRef.current = setInterval(() => {
      asyncFetchMetricsData();
    }, 60000);
  };

  const screenChartRef = useRef<any>(null);

  return (
    <div className={styles.screenChart}>
      {data.length > 0 && (
        <AreaChart
          data={data}
          ref={screenChartRef}
          scaleConfig={{
            time: {
              type: 'time',
              mask: 'M/DD HH:mm',
            },
            ticks: [],
            value: {
              min: 0,
              max: metricItem?.yValues?.max || _.max(data.map(d => d.value)),
            },
          }}
          metricItem={metricItem}
          color={color}
        />
      )}
    </div>
  );
});

export default connect(mapState, mapDispatch, null, { forwardRef: true })(
  ScreenChart,
);
