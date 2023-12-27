import { merge } from 'lodash';
import { Construct } from 'constructs';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ClusterProps } from 'aws-cdk-lib/aws-ecs';

export interface EcsClusterConstructProps {
  clusterProps: ClusterProps & { vpc: Vpc };
}

const defaultEcsClusterProps = {
  containerInsights: true,
};
export class EcsClusterConstruct extends Construct {
  readonly cluster: Cluster;

  constructor(scope: Construct, id: string, props: EcsClusterConstructProps) {
    super(scope, id);

    const clusterProps = merge(defaultEcsClusterProps, props.clusterProps);

    this.cluster = new Cluster(this, `ecs-cluster`, clusterProps);
  }
}
