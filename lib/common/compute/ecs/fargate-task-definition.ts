import { merge } from 'lodash';
import { Construct } from 'constructs';
import {
  FargateTaskDefinition,
  FargateTaskDefinitionProps,
} from 'aws-cdk-lib/aws-ecs';

const defaultTaskDefinitionProps: FargateTaskDefinitionProps = {
  memoryLimitMiB: 512,
  cpu: 256,
};

export class FargateTaskDefinitionConstruct extends Construct {
  readonly fargateTaskDefinition: FargateTaskDefinition;
  constructor(
    scope: Construct,
    id: string,
    props?: FargateTaskDefinitionProps,
  ) {
    super(scope, id);

    const taskDefinitionProps = merge(defaultTaskDefinitionProps, props);
    this.fargateTaskDefinition = new FargateTaskDefinition(
      this,
      'fargate-task-definition',
      taskDefinitionProps,
    );
  }
}
