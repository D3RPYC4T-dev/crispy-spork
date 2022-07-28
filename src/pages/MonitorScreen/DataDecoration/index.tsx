import React, { useMemo, forwardRef, useState } from 'react';
import classnames from 'classnames';
import { deepMerge } from '@jiaminghi/charts/lib/util/index';
import { deepClone } from '@jiaminghi/c-render/lib/plugin/util';
import { useAutoResize } from '@jiaminghi/data-view-react';

import { uuid } from '@base/utils';
import bgImg from '@base/static/images/screen_tittle_bg.png';

import styles from './index.module.less';

const defaultColor = ['#1a98fc', '#2cf7fe'];
const STOKE_WIDTH = 3;

const DataDecration = forwardRef(
  (
    { children, className, style, color = [], showLine = true, dur = 3 }: any,
    ref,
  ) => {
    const { width, height, domRef } = useAutoResize(ref);

    const mergedColor = useMemo(
      () => deepMerge(deepClone(defaultColor, true), color || []),
      [color],
    );

    const classNames = useMemo(
      () => classnames(styles.cusDecoration, className),
      [className],
    );

    const [{ path, gradient, mask }] = useState(() => {
      const id = uuid();

      return {
        path: `border-box-8-path-${id}`,
        gradient: `border-box-8-gradient-${id}`,
        mask: `border-box-8-mask-${id}`,
      };
    });

    const length = useMemo(() => (width + height - 5) * 2, [width, height]);

    const pathD = useMemo(
      () =>
        `M 20 0 L ${width}, 0 L ${width}, ${height - 30} L ${
          width - 20
        }, ${height} L 0, ${height} L 0, 30 L 20,0`,
      [width, height],
    );

    return (
      <div className={classNames} style={style} ref={domRef}>
        <img
          className={`${styles.titleBg} ${styles.normalTitleBg}`}
          src={bgImg}
        />
        {width > 200 && (
          <img
            className={`${styles.titleBg} ${styles.reverseTitleBg}`}
            src={bgImg}
          />
        )}
        <svg width={`${width}px`} height={`${height}px`}>
          <defs>
            <path id={path} d={pathD} fill="transparent" />
            <radialGradient id={gradient} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="1" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>

            <mask id={mask}>
              <circle cx="0" cy="0" r="150" fill={`url(#${gradient})`}>
                {/* <animateMotion
                  dur={`${dur}s`}
                  path={pathD}
                  rotate="auto"
                  repeatCount="indefinite"
                /> */}
              </circle>
            </mask>
          </defs>
          {showLine && (
            <line
              x1="0"
              y1="15"
              x2="10"
              y2="0"
              stroke={mergedColor[0]}
              strokeWidth={STOKE_WIDTH}
            />
          )}
          <polygon
            fill={mergedColor[1]}
            fillOpacity={0.2}
            stroke={mergedColor[0]}
            points={`0,30 0, ${height} ${width - 20},${height} ${width},${
              height - 30
            } ${width},0 20,0`}
            strokeWidth={STOKE_WIDTH}
          />
          {showLine && (
            <line
              x1={`${width - 10}`}
              y1={`${height}`}
              x2={width}
              y2={height - 15}
              stroke={mergedColor[0]}
              strokeWidth={STOKE_WIDTH}
            />
          )}
          {/* <use
            stroke={mergedColor[1]}
            strokeWidth="3"
            href={`#${path}`}
            mask={`url(#${mask})`}
          >
            <animate
              attributeName="stroke-dasharray"
              from={`0, ${length}`}
              to={`${length}, 0`}
              dur={`${dur}s`}
              repeatCount="indefinite"
            />
          </use> */}
        </svg>

        <div className={styles.decorationContent}>{children}</div>
      </div>
    );
  },
);

export default DataDecration;
