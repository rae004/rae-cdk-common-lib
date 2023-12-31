import { merge } from 'lodash';
import { Construct } from 'constructs';
import {
  FargateTaskDefinition,
  FargateTaskDefinitionProps,
} from 'aws-cdk-lib/aws-ecs';
import { AppProps } from '@/lib/common/shared/types';

export interface FargateTaskDefinitionConstructProps extends AppProps {
  fargateTaskDefinitionProps?: FargateTaskDefinitionProps;
}

const defaultTaskDefinitionProps: FargateTaskDefinitionProps = {
  memoryLimitMiB: 512,
  cpu: 256,
};

export class FargateTaskDefinitionConstruct extends Construct {
  readonly fargateTaskDefinition: FargateTaskDefinition;
  constructor(
    scope: Construct,
    id: string,
    props: FargateTaskDefinitionConstructProps,
  ) {
    super(scope, id);

    const appName = `${props.appName}-${props.deploymentEnvironment}-fargate-task-definition`;

    const taskDefinitionProps = merge(
      defaultTaskDefinitionProps,
      props?.fargateTaskDefinitionProps,
    );
    this.fargateTaskDefinition = new FargateTaskDefinition(
      this,
      appName,
      taskDefinitionProps,
    );
  }
}
