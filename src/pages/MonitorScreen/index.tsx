import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col } from 'antd';
import intl from 'react-intl-universal';
import {
  Loading,
  DigitalFlop,
  WaterLevelPond,
  // Decoration5,
  // Decoration3,
} from '@jiaminghi/data-view-react';
import { connect } from 'react-redux';
import { debounce } from 'lodash';

import { IDispatch, IRootState } from '@ent/store';
import Icon from '@/components/Icon';
import { PROCESS_STATUS } from '@/utils/process';
import { AlertSeverity, GlobalAlertItem } from '@/utils/interface';
import { compareVersion, getVersion } from '@/utils/dashboard';
import decorationWebp from '@/static/images/decoration.webp';
import { IS_SMALL_SCREEN } from '@/utils';
import ScreenChart from './ScreenChart';
import DataDecration from './DataDecoration';
import BorderBox11 from './BorderBox11';
import BorderBox9 from './BorderBox9';
import BorderBox1 from './BorderBox1';
import BorderBox8 from './BorderBox8';
// import mockCluster from './mockData';

import styles from './index.module.less';
import NodeInfoPanel from './NodeInfoPanel';
import AlertInfoPanel from './AlertInfoPanel';

const mapState = (state: IRootState) => ({
  cluster: state.cluster.cluster,
  aliasConfig: state.app.aliasConfig,
  globalAlerts: state.alert.globalAlerts,
});

const mapDispatch: any = (dispatch: IDispatch) => ({});
interface Props
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}

const COLOR = ['#4fd2dd', '#235fa7'];

function MonitorScreen(props: Props) {
  const { cluster, aliasConfig, globalAlerts } = props;

  const [shouldRender, setShouldRender] = useState<boolean>(false);

  const [isFullScrren, setFullScreen] = useState<boolean>(false);

  const [screenHeight, setScreenHeight] = useState<number>(0);

  const graphBlockRef = useRef(null);
  const storageBlockRef = useRef(null);
  const monitorScreenRef = useRef<any>(null);

  const [alertList, setAlertList] = useState<GlobalAlertItem[]>([]);

  const cpuChartRef = useRef<any>();
  const memoryChartRef = useRef<any>();

  useEffect(() => {
    const e = document.createEvent('Event');
    e.initEvent('resize', true, true);
    window.dispatchEvent(e);
  }, [isFullScrren]);

  useEffect(() => {
    const fn = debounce(() => {
      setScreenHeight(monitorScreenRef.current.clientHeight);
    }, 200);
    window.addEventListener('resize', fn);
    return () => {
      window.removeEventListener('resize', fn);
    };
  }, []);

  useEffect(() => {
    setAlertList(
      globalAlerts.filter(globalAlert => globalAlert.clusterID === cluster.id),
    );
  }, [cluster, globalAlerts]);

  const getScreenHeight = () => {
    const { clientHeight } = monitorScreenRef.current || {
      clientWidth: 0,
      clientHeight: 0,
    };
    return clientHeight;
  };

  useEffect(() => {
    setTimeout(() => {
      setScreenHeight(getScreenHeight());
      setShouldRender(true);
    }, 500);
  }, []);

  const handleZoom = () => {
    setFullScreen(!isFullScrren);
    setTimeout(() => {
      setScreenHeight(getScreenHeight());
    }, 100);
  };

  const countTotalServicesNum = () => {
    if (cluster) {
      const { graphd = [], metad = [], storaged = [] } = cluster;
      return graphd.length + metad.length + storaged.length;
    }
    return 0;
  };

  const exitedServicesNum = useMemo(() => {
    let num = 0;
    if (cluster) {
      ['graphd', 'metad', 'storaged'].forEach(service => {
        num += (cluster[service] || []).reduce(
          (acc, cur) => (cur.status === PROCESS_STATUS.exited ? acc + 1 : acc),
          0,
        );
      });
    }
    return num;
  }, [cluster]);

  // const countExitServicesNum = () => {

  // };

  const [cpuUsedData, setCpuUsedData] = useState([0]);
  const [meomoryUsedData, setMemoryUsedData] = useState([0]);

  useEffect(() => {
    setTimeout(() => {
      const cpuUseData = getUsedValue(cpuChartRef);
      setCpuUsedData(cpuUseData);
      const memoryData = getUsedValue(memoryChartRef);
      setMemoryUsedData(memoryData);
    }, 1000);
  }, [cpuChartRef.current]);

  const getUsedValue = ref => {
    let result = 0;
    if (ref.current) {
      result = ref.current.getLatestValue().value;
    }
    return [result];
  };

  const renderClusterFraction = () => {
    let result = 100;
    if (cluster) {
      const totalServiceNum = countTotalServicesNum();
      // const exitServiceNum = exitedServicesNum;
      result = (1 - Math.floor(exitedServicesNum / totalServiceNum)) * 100;
      const emergencyNum = alertList.reduce((x, y) => {
        if (
          y.clusterID === cluster.id &&
          y.severity === AlertSeverity.EMERGENCY
        ) {
          x += 1;
        }
        return x;
      }, 0);
      result -= emergencyNum === 1 ? 40 : 10 * emergencyNum;
    }
    result = Math.max(13, result);
    let color = '#08FFFF';
    if (result <= 100 && result >= 80) {
      color = '#08FFFF';
    } else if (result < 80 && result >= 60) {
      color = '#f2994a';
    } else {
      color = '#ff4646';
    }

    return (
      <div className={styles.healthNum}>
        <DigitalFlop
          config={{
            number: [result],
            style: { fontSize: result > 100 ? 48 : 38, fill: color },
          }}
          className={styles.flop}
        />
      </div>
    );
  };

  return (
    <div
      className={`${styles.monitorScreen} ${
        isFullScrren ? styles.fullScreen : ''
      }`}
      ref={monitorScreenRef}
    >
      {(!cluster.id || !shouldRender) && <Loading />}
      {shouldRender && (
        <>
          <Icon
            className={styles.zoom}
            icon={isFullScrren ? '#iconzoom-in' : '#iconzoom'}
            onClick={handleZoom}
          />
          <div className={styles.headerMain}>
            <div className={styles.leftBg} />
            <div className={styles.rightBg} />
            <h3 className={styles.title}>{cluster.name}</h3>
            <img
              className={styles.leftDecoration}
              src={decorationWebp}
              style={{
                width: IS_SMALL_SCREEN ? '140px' : '200px',
                height: '30px',
              }}
            />
            <img
              className={styles.rightDecoration}
              src={decorationWebp}
              style={{
                width: IS_SMALL_SCREEN ? '140px' : '200px',
                height: '30px',
              }}
            />
          </div>
          <Row gutter={24} className={styles.metrics}>
            <Col span={5}>
              <BorderBox11
                className={styles.borderBox}
                color={COLOR}
                style={{ height: '260px' }}
                title={intl.get('common.qps')}
              >
                <ScreenChart aliasConfig={aliasConfig} metricType="qps" />
              </BorderBox11>
              <BorderBox11
                className={styles.storageMetrics}
                color={COLOR}
                style={{ height: `${screenHeight - 360}px` }}
                ref={storageBlockRef}
                title="Storage Metrics"
              >
                <div className={styles.storageChartBlock}>
                  <div className={styles.chartTitle}>add edge latency</div>
                  <ScreenChart
                    aliasConfig={aliasConfig}
                    metricType="addEdgeLatency"
                  />
                </div>
                <div className={styles.storageChartBlock}>
                  <div className={styles.chartTitle}>add vertics latency</div>
                  <ScreenChart
                    aliasConfig={aliasConfig}
                    metricType="addVerticsLatency"
                  />
                </div>
              </BorderBox11>
            </Col>
            <Col span={14}>
              <div
                className={styles.center}
                style={{ height: `${screenHeight - 100}px` }}
              >
                <BorderBox9
                  color={COLOR}
                  className={styles.topCenter}
                  style={{ height: (screenHeight - 100) * 0.55 }}
                >
                  <div className={styles.topDataCenter}>
                    <div className={styles.dataCenterLeft}>
                      <DataDecration
                        style={{ minWidth: IS_SMALL_SCREEN ? 170 : 200 }}
                      >
                        <div className={styles.nodeHealthBlock}>
                          <div className={styles.nodeHealth}>
                            {intl.get('common.bigscreeninfo.clusterHealth')}
                          </div>
                          {renderClusterFraction()}
                        </div>
                      </DataDecration>
                      <DataDecration
                        className={styles.decorationItem}
                        style={{ minWidth: IS_SMALL_SCREEN ? 65 : 85 }}
                      >
                        <div className={styles.nodeInfoBlock}>
                          <div className={styles.nodeTitle}>
                            {intl.get('common.bigscreeninfo.runningNode')}
                          </div>
                          <div className={styles.nodeNum}>
                            <DigitalFlop
                              config={{
                                number: [cluster.machines?.length || 0],
                                content: '{nt}',
                                style: { fontSize: 25, fill: '#08FFFF' },
                              }}
                              className={styles.flop}
                            />
                          </div>
                        </div>
                      </DataDecration>
                      <DataDecration
                        className={styles.decorationItem}
                        style={{ minWidth: IS_SMALL_SCREEN ? 65 : 85 }}
                      >
                        <div className={styles.nodeInfoBlock}>
                          <div className={styles.nodeTitle}>
                            {intl.get('common.bigscreeninfo.runningService')}
                          </div>
                          <div className={styles.nodeNum}>
                            <DigitalFlop
                              config={{
                                number: [countTotalServicesNum()],
                                content: '{nt}',
                                style: { fontSize: 25, fill: '#08FFFF' },
                              }}
                              className={styles.flop}
                            />
                          </div>
                        </div>
                      </DataDecration>
                      <DataDecration className={styles.decorationItem}>
                        <div className={styles.nodeInfoBlock}>
                          <div
                            className={styles.nodeTitle}
                            style={{ color: '#FF4646' }}
                          >
                            {intl.get('common.bigscreeninfo.abnormalService')}
                          </div>
                          <div className={styles.nodeNum}>
                            <DigitalFlop
                              config={{
                                number: [exitedServicesNum],
                                content: '{nt}',
                                style: { fontSize: 25, fill: '#FF4646' },
                              }}
                              className={styles.flop}
                            />
                          </div>
                        </div>
                      </DataDecration>
                    </div>
                    <div className={styles.dataCenterRight}>
                      <div className={styles.waterBlock}>
                        <WaterLevelPond
                          config={{
                            data: cpuUsedData,
                            shape: 'roundRect',
                            waveHeight: 8,
                            waveNum: 2,
                            waveOpacity: 0.4,
                          }}
                        />
                        <div className={styles.waterTitle}>
                          {intl.get('common.bigscreeninfo.cpuUsage')}
                        </div>
                      </div>
                      <div className={styles.waterBlock}>
                        <WaterLevelPond
                          config={{
                            data: meomoryUsedData,
                            shape: 'roundRect',
                            waveHeight: 8,
                            waveNum: 2,
                            waveOpacity: 0.4,
                          }}
                        />
                        <div className={styles.waterTitle}>
                          {intl.get('common.bigscreeninfo.memoryUsage')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.dataCenterBottom}>
                    <NodeInfoPanel cluster={cluster} />
                    <AlertInfoPanel
                      config={{
                        data: alertList,
                        waitTime: 5000,
                      }}
                    />
                  </div>
                </BorderBox9>
                <div className={styles.bottomCenter}>
                  <BorderBox11
                    className={styles.graphMetrics}
                    color={COLOR}
                    ref={graphBlockRef}
                    style={{ height: `${(screenHeight - 100) * 0.45}px` }}
                    title="Graph Metrics"
                  >
                    <div className={styles.graphBlock}>
                      <div className={styles.graphHalfBlock}>
                        <div className={styles.graphChartBlock}>
                          {compareVersion(
                            getVersion(cluster.version),
                            '3.0.0',
                          ) >= 0 ? (
                            <>
                              <div className={styles.graphChartTitle}>
                                active session nums
                              </div>
                              <ScreenChart
                                aliasConfig={aliasConfig}
                                metricType="activeSessionNum"
                              />
                            </>
                          ) : (
                            <>
                              <div className={styles.graphChartTitle}>
                                query latency
                              </div>
                              <ScreenChart
                                aliasConfig={aliasConfig}
                                metricType="queryLatency"
                              />
                            </>
                          )}
                        </div>

                        <div
                          className={styles.graphChartBlock}
                          style={{ paddingTop: 0 }}
                        >
                          {compareVersion(
                            getVersion(cluster.version),
                            '3.0.0',
                          ) >= 0 ? (
                            <>
                              <div
                                className={styles.graphChartTitle}
                                style={{ marginTop: 10 }}
                              >
                                active query nums
                              </div>
                              <ScreenChart
                                aliasConfig={aliasConfig}
                                metricType="activeQueryNum"
                              />
                            </>
                          ) : (
                            <>
                              <div
                                className={styles.graphChartTitle}
                                style={{ marginTop: 10 }}
                              >
                                slow query latency
                              </div>
                              <ScreenChart
                                aliasConfig={aliasConfig}
                                metricType="slowQueryLatency"
                              />
                            </>
                          )}
                        </div>
                      </div>
                      <div className={styles.graphHalfBlock}>
                        <div className={styles.graphChartBlock}>
                          <div className={styles.graphChartTitle}>
                            slow query percentage
                          </div>
                          <ScreenChart
                            aliasConfig={aliasConfig}
                            metricType="slowQueryPercentage"
                          />
                        </div>
                        <div
                          className={styles.graphChartBlock}
                          style={{ paddingTop: 0 }}
                        >
                          <div
                            className={styles.graphChartTitle}
                            style={{ marginTop: 10 }}
                          >
                            error query percentage
                          </div>
                          <ScreenChart
                            aliasConfig={aliasConfig}
                            metricType="queryErrorPercentage"
                          />
                        </div>
                      </div>
                    </div>
                  </BorderBox11>
                </div>
              </div>
            </Col>
            <Col span={5}>
              <div
                className={styles.center}
                style={{ height: `${screenHeight - 100}px` }}
              >
                <BorderBox1 className={styles.nodeMetricsTop} color={COLOR}>
                  <div className={styles.chartTitle}>
                    {intl.get('common.bigscreeninfo.cpu')}
                  </div>
                  <ScreenChart
                    ref={cpuChartRef}
                    aliasConfig={aliasConfig}
                    metricType="cpuUsed"
                  />
                </BorderBox1>
                <BorderBox1 className={styles.nodeMetricsTop} color={COLOR}>
                  <div className={styles.chartTitle}>
                    {intl.get('common.bigscreeninfo.memory')}
                  </div>
                  <ScreenChart
                    aliasConfig={aliasConfig}
                    metricType="memoryUsed"
                    ref={memoryChartRef}
                  />
                </BorderBox1>
                <BorderBox1 className={styles.nodeMetricsTop} color={COLOR}>
                  <div className={styles.chartTitle}>
                    {intl.get('common.bigscreeninfo.load')}
                  </div>
                  <ScreenChart aliasConfig={aliasConfig} metricType="cpuLoad" />
                </BorderBox1>
                <BorderBox8
                  className={styles.nodeMetricsBottom}
                  style={{ height: `${(screenHeight - 100) * 0.4}px` }}
                  title="Node Metrics"
                >
                  <div className={styles.diskBlock}>
                    <div className={styles.diskChartBlock}>
                      <div className={styles.diskChartTitle}>
                        disk readbytes
                      </div>
                      <ScreenChart
                        aliasConfig={aliasConfig}
                        metricType="diskReadBytes"
                      />
                    </div>
                    <div className={styles.diskChartBlock}>
                      <div className={styles.diskChartTitle}>
                        disk writebytes
                      </div>
                      <ScreenChart
                        aliasConfig={aliasConfig}
                        metricType="diskWriteBytes"
                      />
                    </div>
                  </div>
                </BorderBox8>
              </div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

export default connect(mapState, mapDispatch)(MonitorScreen);
