export type DeploymentEnvironmentsUnion = 'production' | 'staging' | 'develop';
export type AppProps = {
  deploymentEnvironment: DeploymentEnvironmentsUnion;
  appName: string;
};
