import React, { useState, useMemo, forwardRef } from 'react';

import PropTypes from 'prop-types';

import classnames from 'classnames';

import { deepMerge } from '@jiaminghi/charts/lib/util/index';
import { deepClone } from '@jiaminghi/c-render/lib/plugin/util';

import { useAutoResize } from '@jiaminghi/data-view-react';

import { uuid } from '@/utils';

import './index.less';

const defaultColor = ['#235fa7', '#4fd2dd'];

const BorderBox = forwardRef(
  (
    {
      children,
      className,
      style,
      color = [],
      dur = 10,
      backgroundColor = 'transparent',
      reverse = false,
    }: any,
    ref,
  ) => {
    const { width, height, domRef } = useAutoResize(ref);

    const [{ path, gradient, mask }] = useState(() => {
      const id = uuid();

      return {
        path: `border-box-8-path-${id}`,
        gradient: `border-box-8-gradient-${id}`,
        mask: `border-box-8-mask-${id}`,
      };
    });

    const pathD = useMemo(
      () =>
        reverse
          ? `M 2.5, 2.5 L 2.5, ${height - 2.5} L ${width - 2.5}, ${
              height - 2.5
            } L ${width - 2.5}, 2.5 L 2.5, 2.5`
          : `M2.5, 2.5 L${width - 2.5}, 2.5 L${width - 2.5}, ${
              height - 2.5
            } L2.5, ${height - 2.5} L2.5, 2.5`,
      [width, height, reverse],
    );

    const mergedColor = useMemo(
      () => deepMerge(deepClone(defaultColor, true), color || []),
      [color],
    );

    const length = useMemo(() => (width + height - 5) * 2, [width, height]);

    const classNames = useMemo(
      () => classnames('dv-border-box-8', className),
      [className],
    );

    return (
      <div className={classNames} style={style} ref={domRef}>
        <svg className="dv-border-svg-container" width={width} height={height}>
          <path
            stroke={mergedColor[1]}
            d={pathD}
            strokeWidth="3"
            fill="transparent"
          />
        </svg>

        <div className="border-box-content">{children}</div>
      </div>
    );
  },
);

BorderBox.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  color: PropTypes.array,
  dur: PropTypes.number,
  backgroundColor: PropTypes.string,
  reverse: PropTypes.bool,
};

export default BorderBox;
