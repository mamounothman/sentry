import React from 'react';

import ApiMixin from '../../mixins/apiMixin';
import LoadingIndicator from '../loadingIndicator';
import {t} from '../../locale';

import SidebarPanel from '../sidebarPanel';
import SidebarPanelItem from '../sidebarPanelItem';

const Broadcasts = React.createClass({
  mixins: [
    ApiMixin
  ],

  getInitialState() {
    return {
      broadcasts: [],
      loading: true,
      error: false
    };
  },

  componentWillMount() {
    this.fetchData();
  },

  componentWillUnmount() {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.poller) {
      window.clearTimeout(this.poller);
      this.poller = null;
    }
  },

  remountComponent() {
    this.setState(this.getInitialState(), this.fetchData);
  },

  fetchData(callback) {
    if (this.poller) {
      window.clearTimeout(this.poller);
    }
    this.api.request('/broadcasts/', {
      method: 'GET',
      success: (data) => {
        this.setState({
          broadcasts: data,
          loading: false
        });
        this.poller = window.setTimeout(this.fetchData, 60000);
      },
      error: () => {
        this.setState({
          loading: false,
          error: true
        });
        this.poller = window.setTimeout(this.fetchData, 60000);
      }
    });
  },

  onOpen() {
    this.timer = window.setTimeout(this.markSeen, 1000);
  },

  onClose() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },

  markSeen() {
    let broadcastIds = this.state.broadcasts.filter((item) => {
      return !item.hasSeen;
    }).map((item) => {
      return item.id;
    });

    if (broadcastIds.length === 0)
      return;

    this.api.request('/broadcasts/', {
      method: 'PUT',
      query: {id: broadcastIds},
      data: {
        hasSeen: '1'
      },
      success: () => {
        this.setState({
          broadcasts: this.state.broadcasts.map((item) => {
            item.hasSeen = true;
            return item;
          })
        });
      },
    });
  },

  render() {
    let {broadcasts, loading} = this.state;
    let unseenCount = broadcasts.filter((item) => {
      return !item.hasSeen;
    }).length;

    let title = <span className="icon-globe" />;
    return (
      <li className={this.props.currentPanel == 'broadcasts' ? 'active' : null }>
        <a className="broadcasts-toggle" onClick={this.props.onShowPanel}>
          <span className="icon-globe"/>
          <span className="activity-indicator" />
        </a>
        {this.props.showPanel && this.props.currentPanel == 'broadcasts' &&
          <SidebarPanel title={t('Recent updates from Sentry')}
                        hidePanel={this.props.hidePanel}>
              {loading ?
                <LoadingIndicator />
              : (broadcasts.length === 0 ?
                <div className="sidebar-panel-empty">{t('No recent updates from the Sentry team.')}</div>
              :
                broadcasts.map((item) => {
                  return (
                    <SidebarPanelItem
                      key={item.id}
                      className={!item.hasSeen && 'unseen'}
                      title={item.title}
                      message={item.message}
                      link={item.link}>
                    </SidebarPanelItem>
                  );
                })
              )}
          </SidebarPanel>
        }
      </li>
    );
  }
});

export default Broadcasts;
