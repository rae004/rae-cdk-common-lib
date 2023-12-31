import { merge } from 'lodash';
import { Construct } from 'constructs';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ClusterProps } from 'aws-cdk-lib/aws-ecs';
import { AppProps } from '../../shared';

export interface EcsClusterConstructProps extends AppProps {
  clusterProps: ClusterProps & { vpc: Vpc };
}

const defaultEcsClusterProps: ClusterProps = {
  containerInsights: true,
};
export class EcsClusterConstruct extends Construct {
  readonly cluster: Cluster;

  constructor(scope: Construct, id: string, props: EcsClusterConstructProps) {
    super(scope, id);

    const appName = `${props.appName}-${props.deploymentEnvironment}-cluster`;

    const clusterProps = merge(
      defaultEcsClusterProps,
      { clusterName: appName },
      props.clusterProps,
    );

    this.cluster = new Cluster(this, appName, clusterProps);
  }
}
