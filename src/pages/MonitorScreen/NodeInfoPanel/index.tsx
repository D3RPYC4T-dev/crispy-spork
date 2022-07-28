import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';
import { useAutoResize } from '@jiaminghi/data-view-react';
import intl from 'react-intl-universal';
import { Carousel } from 'antd';

import NormalNodeImg from '@base/static/images/screen_service_icon_normal.svg';
import ErrorNodeImg from '@base/static/images/screen_service_icon_error.svg';
import { ICluster, IMachine, IServiced } from '@base/utils/interface';
import { PROCESS_STATUS } from '@base/utils/process';
import { IS_SMALL_SCREEN } from '@base/utils';
import { debounce } from 'lodash';
import DataDecration from '../DataDecoration';
import styles from './index.module.less';

interface Props {
  className?: any;
  style?: any;
  cluster: ICluster;
}

type MachinServiceInfo = Pick<ICluster, 'graphd' | 'metad' | 'storaged'>;

const NodeInfoPanel = forwardRef((props: Props, ref) => {
  const { className = '', style = {}, cluster } = props;
  const { domRef } = useAutoResize(ref);

  const [nodeItemRect, setNodeItemRect] = useState<number[]>([0, 0]);

  const smallNodePanelRef = useRef<any>(null);

  const classNames = useMemo(
    () => classnames(styles.nodeInfoPanel, className),
    [className],
  );

  useEffect(() => {
    const fn = debounce(() => {
      setTimeout(() => {
        setNodeItemRect(calcNodePanelRect());
      }, 400);
    }, 400);
    window.addEventListener('resize', fn);
    return () => {
      window.removeEventListener('resize', fn);
    };
  }, []);

  useEffect(() => {
    setNodeItemRect(calcNodePanelRect());
  }, []);

  const getMachineIServiceInfoByHost = (host: string): MachinServiceInfo => {
    const result: any = {};
    if (!cluster) return result;
    ['graphd', 'metad', 'storaged'].forEach(service => {
      result[service] = cluster[service].filter(item => item.host === host);
    });
    return result;
  };

  const machineMaps = useMemo(
    () => ({
      alias: [intl.get('common.bigscreeninfo.alias'), ''],
      memory: [intl.get('common.bigscreeninfo.memoryTitle'), 'GB'],
      disk: [intl.get('common.bigscreeninfo.diskTitle'), 'GB'],
    }),
    [],
  );

  const heightScalePercent = useMemo(
    () => 1 / Math.ceil((cluster?.machines.length || 1) / 2),
    [cluster],
  );
  const widthScalePercent = useMemo(
    () => ((cluster?.machines.length || 1) > 1 ? 1 / 2 : 1),
    [cluster],
  );

  const calStatus = useCallback(
    (machineServiceInfo: MachinServiceInfo): boolean => {
      let result = true;
      Object.keys(machineServiceInfo).forEach(key => {
        machineServiceInfo[key].forEach((service: IServiced) => {
          if (service.status !== PROCESS_STATUS.running) {
            result = false;
          }
        });
      });
      return result;
    },
    [],
  );

  const getMachineInfoByHost = (host: string) => {
    // console.log('zzz calcStatus')
    const result: any = {};
    if (!cluster) return result;
    const machine = cluster.machines.find(m => m.host === host);
    if (machine) {
      Object.keys(machineMaps).forEach(key => {
        result[key] = {
          title: machineMaps[key][0],
          unit: machineMaps[key][1],
          value: machine[key],
        };
      });
      const machineServiceResult = getMachineIServiceInfoByHost(host);
      result.status = {
        title: intl.get('common.bigscreeninfo.status'),
        unit: '',
        value: calStatus(machineServiceResult) ? 'running' : 'exited',
      };
      result.version = {
        title: intl.get('common.bigscreeninfo.coreVersion'),
        unit: '',
        value: cluster.version,
      };
    }
    return result;
  };

  const renderRightPanelItem = (machine: IMachine) => {
    const machineInfo = getMachineInfoByHost(machine.host);
    return Object.keys(machineInfo).map((key, index) => (
      <div className={styles.machineInfoItem} key={index}>
        <div
          className={styles.infoTitle}
          style={{
            fontSize: Math.min(heightScalePercent * 18, widthScalePercent * 18),
          }}
        >
          {machineInfo[key].title}
        </div>
        <div
          className={styles.infoValue}
          style={{
            fontSize: Math.min(heightScalePercent * 18, widthScalePercent * 18),
          }}
        >{`${machineInfo[key].value} ${machineInfo[key].unit}`}</div>
      </div>
    ));
  };

  const calcNodePanelRect = useCallback(() => {
    if (!smallNodePanelRef.current) return [0, 0];
    const num = IS_SMALL_SCREEN ? 3 : 4;
    const { clientWidth, clientHeight } = smallNodePanelRef.current;
    const calcHeight = () => {
      if (Math.floor(clientHeight / 2) < 220) {
        return clientHeight;
      }
      return Math.floor(clientHeight / 2);
    };
    return [Math.max(Math.floor(clientWidth / num), 165), calcHeight()];
  }, [smallNodePanelRef.current, nodeItemRect]);

  const sortMachines = useCallback((machines: IMachine[]) => {
    machines.sort((a, b) => {
      const resultA = getMachineInfoByHost(a.host);
      const resultB = getMachineInfoByHost(b.host);
      if (
        resultA.status.value === 'running' &&
        resultB.status.value !== 'running'
      ) {
        return 1;
      }
      if (
        resultA.status.value !== 'running' &&
        resultB.status.value === 'running'
      ) {
        return -1;
      }
      return 0;
    });
    return machines;
  }, []);

  const rowsMemo = useMemo(() => {
    const machines = cluster.machines;
    if (!machines) return [];
    if (machines.length < 4) return [];
    if (!smallNodePanelRef.current) return [];
    const sortedMachines = sortMachines(machines);
    const { clientWidth, clientHeight } = smallNodePanelRef.current;
    const [width, height] = nodeItemRect;
    let rowNum = Math.floor(clientWidth / width);
    rowNum *= Math.floor(clientHeight / height);
    const rows: Array<IMachine[]> = [];
    for (let i = 0; i < sortedMachines.length; i += rowNum) {
      rows.push(sortedMachines.slice(i, i + rowNum));
    }
    return rows;
  }, [smallNodePanelRef.current, nodeItemRect]);

  const getNodeImgByStatus = (machine: IMachine) => {
    const result = getMachineInfoByHost(machine.host);
    if (result.status.value === 'running') {
      return NormalNodeImg;
    }
    return ErrorNodeImg;
  };

  const renderServiceInfo = (machine: IMachine) => {
    const machineServiceInfo = getMachineIServiceInfoByHost(machine.host);
    return Object.keys(getMachineIServiceInfoByHost(machine.host)).map(
      (service, index) => (
        <div key={index} className={styles.serviceItem}>
          {machineServiceInfo[service].map((item, index) =>
            item.status === PROCESS_STATUS.running ? (
              <span key={index}>{service}</span>
            ) : (
              <span className={styles.abnormalService} key={index}>
                {service}
              </span>
            ),
          )}
        </div>
      ),
    );
  };

  return (
    <div className={classNames} style={style} ref={domRef}>
      {cluster?.machines.length <= 4 && (
        <div className={styles.bigNodePanel}>
          {cluster.machines.map((machine, i) => (
            <div
              key={i}
              className={styles.nodePanelItem}
              style={{
                height: `${heightScalePercent * 100 - 3}%`,
                width: `${widthScalePercent * 100 - 3}%`,
              }}
            >
              <div className={styles.leftPanelItem}>
                <img src={NormalNodeImg} className={styles.nodeImg} />
                <DataDecration
                  showLine={false}
                  className={styles.nodeHost}
                  style={{ height: heightScalePercent < 1 ? '36px' : '46px' }}
                >
                  <span
                    style={{
                      fontSize: IS_SMALL_SCREEN ? '14px' : '16px',
                    }}
                  >
                    {machine.host}
                  </span>
                </DataDecration>
                <div className={styles.serviceInfo}>
                  {renderServiceInfo(machine)}
                </div>
              </div>
              <div className={styles.rightPanelItem}>
                {renderRightPanelItem(machine)}
              </div>
            </div>
          ))}
        </div>
      )}
      {cluster?.machines.length > 4 && (
        <div className={styles.smallNodePanel} ref={smallNodePanelRef}>
          {rowsMemo.length > 0 && (
            <Carousel
              dotPosition="left"
              autoplay
              dots={false}
              autoplaySpeed={5000}
            >
              {rowsMemo.map((row, i) => (
                <div className={styles.nodeInfoRow} key={i}>
                  {row.map((machine, i) => (
                    <div
                      className={styles.smallPanelItem}
                      key={i + machine.host}
                      style={{
                        width: `${nodeItemRect[0]}px`,
                        height: `${nodeItemRect[1]}px`,
                      }}
                    >
                      <img
                        src={getNodeImgByStatus(machine)}
                        className={styles.nodeImg}
                      />
                      <DataDecration
                        showLine={false}
                        className={styles.nodeHost}
                        style={{
                          width: `${nodeItemRect[0] * 0.8}px`,
                          height: heightScalePercent < 1 ? '36px' : '46px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: IS_SMALL_SCREEN ? '14px' : '16px',
                          }}
                        >
                          {machine.host}
                        </span>
                      </DataDecration>
                      <div className={styles.serviceInfo}>
                        {renderServiceInfo(machine)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </Carousel>
          )}
        </div>
      )}
    </div>
  );
});

export default NodeInfoPanel;
