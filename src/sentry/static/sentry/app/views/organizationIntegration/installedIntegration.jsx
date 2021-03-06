import {Box, Flex} from 'grid-emotion';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'react-emotion';

import {PanelItem, PanelAlert} from 'app/components/panels';
import {t} from 'app/locale';
import Button from 'app/components/buttons/button';
import Confirm from 'app/components/confirm';
import Switch from 'app/components/switch';
import Tooltip from 'app/components/tooltip';
import FieldFromConfig from 'app/views/settings/components/forms/fieldFromConfig';
import Form from 'app/views/settings/components/forms/form';
import PluginIcon from 'app/plugins/components/pluginIcon';

const IntegrationIcon = styled.img`
  height: 32px;
  width: 32px;
  border-radius: 2px;
  display: block;
`;

const IntegrationName = styled.div`
  font-size: 1.6rem;
  margin-bottom: 3px;
`;

const DomainName = styled.div`
  color: ${p => p.theme.gray3};
  font-size: 1.4rem;
`;

export default class InstalledIntegration extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    projectId: PropTypes.string.isRequired,
    provider: PropTypes.object.isRequired,
    integration: PropTypes.object.isRequired,
    onRemove: PropTypes.func.isRequired,
    onToggleEnabled: PropTypes.func.isRequired,
    onDisable: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.state = {configuring: false};
  }

  onConfigure = () => this.setState({configuring: !this.state.configuring});

  renderConfiguration() {
    const {integration, orgId, projectId} = this.props;
    const {configProject, configOrganization} = integration;

    // Since integrations currently live under project settings, we have the
    // context needed to display both organizatoon-level integration
    // configuration, as well as project-level integration configuration. We
    // make the seperation clear with an alert for now.

    const formProps = {
      hideFooter: true,
      saveOnBlur: true,
      allowUndo: true,
      apiMethod: 'POST',
      dataTransformer: data => ({config: data}),
    };

    return (
      <React.Fragment>
        {configProject.length > 0 && (
          <Form
            {...formProps}
            initialData={integration.configDataProjects[projectId]}
            apiEndpoint={`/projects/${orgId}/${projectId}/integrations/${integration.id}/`}
          >
            {configProject.map(field => (
              <FieldFromConfig key={field.name} field={field} />
            ))}
          </Form>
        )}
        {configOrganization.length > 0 && (
          <React.Fragment>
            <PanelAlert type="info">
              {t(
                'The following configurations are organization-scoped. Changing these will change the settings globally.'
              )}
            </PanelAlert>
            <Form
              {...formProps}
              initialData={integration.configData}
              apiEndpoint={`/organizations/${this.props
                .orgId}/integrations/${integration.id}/`}
            >
              {configOrganization.map(field => (
                <FieldFromConfig key={field.name} field={field} />
              ))}
            </Form>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }

  isEnabledForProject() {
    return this.props.integration.configDataProjects[this.props.projectId] !== undefined;
  }

  hasConfiguration() {
    return (
      this.props.integration.configProject.length > 0 ||
      this.props.integration.configOrganization.length > 0
    );
  }

  disableIntegration(integration) {
    const message = `You must uninstall this integration
      from ${integration.provider.key} in order to delete this integration
      in Sentry.`;
    return (
      <Box mr={1} pr={2}>
        <Confirm
          disabled={false}
          confirmText={t('Go to GitHub')}
          message={t(message)}
          onConfirm={() => this.props.onDisable(integration)}
        >
          <Button size="small">
            <span className="icon icon-trash" style={{margin: 0}} />
          </Button>
        </Confirm>
      </Box>
    );
  }

  removeIntegration(integration) {
    const message = `Removing this integration will disable
      the integration for all projects and any
      repositories from this integration.
      Are you sure you want to remove this integration?`;
    return (
      <Box mr={1} pr={2}>
        <Confirm
          disabled={integration.status === 'disabled'}
          message={t(message)}
          onConfirm={() => this.props.onRemove()}
        >
          <Button size="small">
            <span className="icon icon-trash" style={{margin: 0}} />
          </Button>
        </Confirm>
      </Box>
    );
  }

  render() {
    const {integration, provider} = this.props;
    const enabled = this.isEnabledForProject();
    const style =
      integration.status === 'disabled' ? {filter: 'grayscale(1)', opacity: '0.4'} : {};

    return (
      <React.Fragment>
        <PanelItem p={0} py={2} key={integration.id} align="center">
          <Box style={style} pl={2}>
            {integration.icon ? (
              <IntegrationIcon src={integration.icon} />
            ) : (
              <PluginIcon size={32} pluginId={provider.key} />
            )}
          </Box>
          <Box style={style} px={2} flex={1}>
            <IntegrationName>{integration.name}</IntegrationName>
            <DomainName>{integration.domainName}</DomainName>
          </Box>
          {provider.canAddProject && (
            <Flex mr={1}>
              <Tooltip title={t('Enable for this Project')}>
                <Switch
                  size="lg"
                  isActive={enabled}
                  toggle={() => this.props.onToggleEnabled(!enabled)}
                />
              </Tooltip>
            </Flex>
          )}
          {this.hasConfiguration() && (
            <Box mr={1}>
              <Button
                size="small"
                disabled={!this.isEnabledForProject()}
                priority={this.state.configuring ? 'primary' : undefined}
                onClick={this.onConfigure}
              >
                Configure
              </Button>
            </Box>
          )}
          {integration.status === 'active' && integration.provider.key === 'github'
            ? this.disableIntegration(integration)
            : this.removeIntegration(integration)}
        </PanelItem>
        <div
          style={{
            display:
              this.state.configuring && this.isEnabledForProject() ? 'block' : 'none',
          }}
        >
          {this.renderConfiguration()}
        </div>
      </React.Fragment>
    );
  }
}
