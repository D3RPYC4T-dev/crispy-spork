import React, { forwardRef, useEffect, useRef } from 'react';
import DataSet from '@antv/data-set';
import { Chart } from '@antv/g2';
import { useAutoResize } from '@jiaminghi/data-view-react';
import _ from 'loadsh';

interface Props {
  data: any[];
  scaleConfig: any;
  color: string;
  metricItem: any;
}

const AreaChart = forwardRef((props: Props, ref) => {
  const { data, scaleConfig, color, metricItem } = props;

  const { width, height, domRef: chartRef } = useAutoResize(ref);

  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    renderChart();
  }, [chartInstanceRef]);

  useEffect(() => {
    if (chartInstanceRef.current) {
      const e = document.createEvent('Event');
      e.initEvent('resize', true, true);
      window.dispatchEvent(e);
      chartInstanceRef.current.render(true);
    }
  }, [chartRef.current?.clientWidth, chartRef.current?.clientHeight]);

  const renderChart = async () => {
    if (!data.length) return;
    const startTime = data[0].time;
    const endTime = data[data.length - 1].time;
    const ds = new DataSet({
      state: {
        start: new Date(startTime).getTime(),
        end: new Date(endTime).getTime(),
      },
    });
    const dv = ds.createView('origin').source(data);
    dv.transform({
      type: 'filter',
      callback: function callback(obj) {
        const time = new Date(obj.time).getTime(); // !注意：时间格式，建议转换为时间戳进行比较
        return time >= ds.state.start && time <= ds.state.end;
      },
    });

    chartInstanceRef.current = new Chart({
      container: chartRef.current,
      autoFit: true,
      height,
      width,
      padding: [16, 30, 44, 50],
    });

    chartInstanceRef.current.data(dv.rows);
    chartInstanceRef.current.scale(scaleConfig);
    chartInstanceRef.current
      .line()
      .adjust('stack')
      .position('time*value')
      .color('type');

    if (metricItem.showInterval) {
      chartInstanceRef.current
        .interval()
        .adjust('stack')
        .position('time*value')
        .color('type')
        .style('value', val => ({
          fillOpacity: 1,
          lineWidth: 0,
          stroke: '#fff',
          lineDash: [3, 2],
        }));
    } else {
      chartInstanceRef.current
        .area()
        .adjust('stack')
        .position('time*value')
        .color('type');
    }

    chartInstanceRef.current.render();
  };

  return <div className="nebula-area-chart" ref={chartRef} />;
});

export default AreaChart;
