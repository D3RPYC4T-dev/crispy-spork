import React, { useEffect, useRef, useState, useMemo, forwardRef } from 'react';
import intl from 'react-intl-universal';
import { useAutoResize } from '@jiaminghi/data-view-react';
import classnames from 'classnames';
import { deepMerge } from '@jiaminghi/charts/lib/util/index';
import { deepClone } from '@jiaminghi/c-render/lib/plugin/util';

import { co } from '@base/utils';
import emptyImg from '@base/static/images/screen_alert_tips_bg.png';

import Icon from '@base/components/Icon';
import styles from './index.module.less';

const defaultConfig = {
  /**
   * @description Board data
   * @type {Array<Object>}
   * @default data = []
   */
  data: [],
  /**
   * @description Row num
   * @type {Number}
   * @default rowNum = 5
   */
  rowNum: 5,
  /**
   * @description Scroll wait time
   * @type {Number}
   * @default waitTime = 2000
   */
  waitTime: 2000,
  /**
   * @description Carousel type
   * @type {String}
   * @default carousel = 'single'
   * @example carousel = 'single' | 'page'
   */
  carousel: 'single',
  /**
   * @description Value unit
   * @type {String}
   * @default unit = ''
   * @example unit = 'ton'
   */
  unit: '',
  /**
   * @description Value formatter
   * @type {Function}
   * @default valueFormatter = null
   */
  valueFormatter: null,
};

function calcRows({ data, rowNum }) {
  const rowLength = data.length;

  if (rowLength > rowNum && rowLength < 2 * rowNum) {
    data = [...data, ...data];
  }

  data = data.map((d, i) => ({ ...d, scroll: i }));

  return data;
}

const ScrollAlertPanel = forwardRef(
  ({ config = {}, className, style }: any, ref) => {
    const { width, height, domRef } = useAutoResize(ref);

    const [state, setState] = useState<any>({
      mergedConfig: null,

      rows: [],

      heights: [],
    });

    const { mergedConfig, rows, heights } = state;

    const stateRef = useRef({
      ...state,
      rowsData: [],
      avgHeight: 0,
      animationIndex: 0,
    });

    const heightRef = useRef(height);

    Object.assign(stateRef.current, state);

    function onResize(onresize = false) {
      if (!mergedConfig) return;

      const heights = calcHeights(mergedConfig, onresize);

      if (heights !== undefined) {
        Object.assign(stateRef.current, { heights });
        setState(state => ({ ...state, heights }));
      }
    }

    function calcData() {
      const mergedConfig = deepMerge(
        deepClone(defaultConfig, true),
        config || {},
      );

      const rows = calcRows(mergedConfig);

      const heights = calcHeights(mergedConfig);

      const data = { mergedConfig, rows };

      heights !== undefined && Object.assign(data, { heights });

      Object.assign(stateRef.current, data, {
        rowsData: rows,
        animationIndex: 0,
      });

      setState(state => ({ ...state, ...data }));
    }

    function calcHeights({ rowNum, data }, onresize = false) {
      const avgHeight = Math.min(height / rowNum, 50);

      Object.assign(stateRef.current, { avgHeight });

      if (!onresize) {
        return new Array(data.length).fill(avgHeight);
      }
    }

    function* animation(start = false) {
      const {
        avgHeight,
        mergedConfig: { waitTime, carousel, rowNum },
        rowsData,
      } = stateRef.current;

      let { animationIndex } = stateRef.current;
      const rowLength = rowsData.length;

      if (start) yield new Promise(resolve => setTimeout(resolve, waitTime));

      const animationNum = carousel === 'single' ? 1 : rowNum;

      let rows = rowsData.slice(animationIndex);
      rows.push(...rowsData.slice(0, animationIndex));
      rows = rows.slice(0, rowNum + 1);

      const heights = new Array(rowLength).fill(avgHeight);
      setState(state => ({ ...state, rows, heights }));

      yield new Promise(resolve => setTimeout(resolve, 300));

      animationIndex += animationNum;

      const back = animationIndex - rowLength;
      if (back >= 0) animationIndex = back;

      const newHeights = [...heights];
      newHeights.splice(0, animationNum, ...new Array(animationNum).fill(0));

      Object.assign(stateRef.current, { animationIndex });
      setState(state => ({ ...state, heights: newHeights }));
    }

    useEffect(() => {
      if (config.data.length === 0) return;
      calcData();

      let start = true;

      function* loop() {
        while (true) {
          yield* animation(start);

          start = false;

          const { waitTime } = stateRef.current.mergedConfig;

          yield new Promise(resolve => setTimeout(resolve, waitTime - 300));
        }
      }

      const {
        mergedConfig: { rowNum },
        rows: rowsData,
      } = stateRef.current;

      const rowLength = rowsData.length;

      if (rowNum >= rowLength) return;

      return co(loop).end;
    }, [config, domRef.current]);

    useEffect(() => {
      if (heightRef.current === 0 && height !== 0) {
        onResize();

        heightRef.current = height;
      } else {
        onResize(true);
      }
    }, [width, height, domRef.current]);

    const classNames = useMemo(
      () => classnames(styles['dv-scroll-ranking-board'], className),
      [className],
    );

    return (
      <div className={classNames} style={style} ref={domRef}>
        <div className={styles.alertPanel}>
          <div className={styles.title}>
            {intl.get('common.bigscreeninfo.alertTitle')}
          </div>
          {config.data.length === 0 ? (
            <div className={styles.emptyContent}>
              <img src={emptyImg} />
              <div className={styles.noData}>
                {intl.get('common.bigscreeninfo.noAlertData')}
              </div>
            </div>
          ) : (
            <div className={styles.alertList}>
              {
                // alertList.map(alert => (
                rows.map((alert, i) => (
                  <div
                    className={styles.rowItem}
                    key={i + alert.scroll}
                    style={{ height: `${heights[i]}px` }}
                  >
                    <div
                      className={`${styles.alert} ${styles[alert.severity]}`}
                    >
                      <div className={styles.alertMsg}>
                        <Icon icon="#iconoverview-alert" />
                      </div>
                      <div className={styles.alertSummary}>{alert.summary}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default ScrollAlertPanel;
