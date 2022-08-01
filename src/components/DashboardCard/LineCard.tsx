import React, { useEffect, useRef } from 'react';
import { Chart } from '@antv/g2';
import { Spin } from 'antd';
import LineChart from '@/components/Charts/LineChart';
import { ILineChartMetric, IStatSingleItem } from '@/utils/interface';
import { configDetailChart } from '@/utils/chart/chart';
import { VALUE_TYPE } from '@/utils/promQL';
import { getMaxNumAndLength } from '@/utils/dashboard';

interface IProps {
  data: ILineChartMetric[];
  valueType: VALUE_TYPE;
  sizes?: IStatSingleItem[];
  loading: boolean;
  baseLine?: number;
}

function LineCard(props: IProps) {
  const { loading, data, valueType, baseLine } = props;
  const { maxNum, maxNumLen } = getMaxNumAndLength({
    data,
    valueType,
    baseLine,
  });

  const chartInstanceRef = useRef<Chart>();

  useEffect(() => {
    /*
    * HACK: it now will conflict with the same request loading in detail component
    * issue: https://github.com/vesoft-inc-private/nebula-dashboard/issues/34
    **/
    if (!loading) {
      updateChart();
    }
  }, [loading])

  const renderLineChart = (chartInstance: Chart) => {
    const { valueType, sizes } = props;
    chartInstanceRef.current = chartInstance;
    configDetailChart(chartInstanceRef.current, {
      valueType,
      sizes,
      isCard: true,
    });
    updateChart();
  };

  const updateChart = () => {
    const { data = [] } = props;
    chartInstanceRef.current?.changeData(data);
  };

  return (
    loading
      ? <Spin />
      : <LineChart
        isDefaultScale={valueType === VALUE_TYPE.percentage} // VALUE_TYPE.percentage has a default Scale
        baseLine={baseLine}
        yAxisMaximum={maxNum}
        renderChart={renderLineChart}
        options={{ padding: [20, 20, 60, 6 * maxNumLen + 30] }}
      />
  );
}

export default LineCard;
