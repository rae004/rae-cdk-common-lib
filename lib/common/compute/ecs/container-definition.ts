import { merge } from 'lodash';
import { Construct } from 'constructs';
import {
  ContainerDefinition,
  ContainerDefinitionProps,
  FargateTaskDefinition,
  LogDriver,
  MountPoint,
  TaskDefinition,
} from 'aws-cdk-lib/aws-ecs';

export interface ContainerDefinitionConstructProps {
  containerDefinitionProps: ContainerDefinitionProps & {
    taskDefinition: TaskDefinition | FargateTaskDefinition;
    mountPoints?: MountPoint[];
  };
}

const defaultContainerDefinitionConfig: Partial<ContainerDefinitionProps> = {
  logging: LogDriver.awsLogs({
    streamPrefix: 'ecs-container-definition',
  }),
};

export class ContainerDefinitionConstruct extends Construct {
  readonly containerDefinition: ContainerDefinition;
  constructor(
    scope: Construct,
    id: string,
    props: ContainerDefinitionConstructProps,
  ) {
    super(scope, id);

    const containerDefinitionProps: ContainerDefinitionProps = merge(
      defaultContainerDefinitionConfig,
      props.containerDefinitionProps,
    );
    this.containerDefinition = new ContainerDefinition(
      this,
      'ecs-container-definition',
      containerDefinitionProps,
    );

    // Add MountPoints to the container definition.
    if (props.containerDefinitionProps.mountPoints) {
      this.containerDefinition.addMountPoints(
        ...props.containerDefinitionProps.mountPoints,
      );
    }

    // Add PortMappings to the container definition.
    if (props.containerDefinitionProps.portMappings?.length) {
      this.containerDefinition.addPortMappings(
        ...props.containerDefinitionProps.portMappings,
      );
    }
  }
}
