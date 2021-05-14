import React from 'react';
import Icon from '@assets/components/Icon';
import intl from 'react-intl-universal';
import { IServicePanelConfig, IStatRangeItem } from '@assets/utils/interface';
import { DETAIL_DEFAULT_RANGE, getDataByType } from '@assets/utils/dashboard';
import { SERVICE_POLLING_INTERVAL } from '@assets/utils/service';
import Card from '@assets/components/Service/ServiceCard/Card';
import { IDispatch, IRootState } from '@assets/store';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';

import './index.less';

const mapDispatch = (dispatch: IDispatch) => {
  return {
    asyncGetMetricsData: dispatch.service.asyncGetMetricsData,
  };
};

const mapState = (state: IRootState) => {
  return {
    servicePanelConfig: state.service.servicePanelConfig
  };
};

interface IProps extends ReturnType<typeof mapDispatch>,
  ReturnType<typeof mapState> {
  onConfigPanel: () => void;
  config: IServicePanelConfig
}

interface IState {
  data: IStatRangeItem[],
}
class CustomServiceQueryPanel extends React.PureComponent<IProps, IState> {
  pollingTimer: any;
  constructor (props: IProps) {
    super(props);
    this.state = {
      data: [],
    };
  }

  componentDidMount () {
    this.pollingData();
  }

  componentWillUnmount () {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }
  }

  componentDidUpdate ( prevProps) {
    if(!isEqual(prevProps.config, this.props.config)) {
      this.resetPollingData();
    }
  }

  resetPollingData = () => {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }
    this.pollingData();
  }

  getMetricsData = async () => {
    const { config } = this.props;
    const { metric: metricName, period: metricPeriod, metricFunction } = config;
    const end = Date.now();
    const data = await this.props.asyncGetMetricsData({
      query: metricFunction + metricPeriod, // EXPLAIN: query like nebula_graphd_num_queries_rate_600
      metric: metricName,
      start: end - DETAIL_DEFAULT_RANGE,
      end,
      timeInterval: metricPeriod
    });
    this.setState({
      data
    });
  }

  pollingData = () => {
    this.getMetricsData();
    this.pollingTimer = setTimeout(this.pollingData, SERVICE_POLLING_INTERVAL);
  }


  render () {
    const { data } = this.state;
    const { config: { metric, period, metricType } } = this.props;
    return <div className="dashboard-card">
      <div className="header">
        <h3>{metric}</h3>
        <div>
          <span>{intl.get('service.period')}: {period}</span> 
          <span>{intl.get('service.metricParams')}: {metricType}</span>
          <div className="btn-icon-with-desc blue" onClick={this.props.onConfigPanel} >
            <Icon icon="#iconSetup" />
            <span>{intl.get('common.set')}</span>
          </div>
        </div>
      </div>
      <div className="content">
        {data.length > 0 && <Card data={getDataByType({ data, type:'all', name:'instanceName' })} loading={false}/>}
      </div>
    </div>;
  }
}

export default connect(mapState, mapDispatch)(CustomServiceQueryPanel);