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
import { AppProps } from '@/lib/common/shared/types';

export interface ContainerDefinitionConstructProps extends AppProps {
  containerDefinitionProps: ContainerDefinitionProps & {
    taskDefinition: TaskDefinition | FargateTaskDefinition;
    mountPoints?: MountPoint[];
  };
}

export class ContainerDefinitionConstruct extends Construct {
  readonly containerDefinition: ContainerDefinition;
  constructor(
    scope: Construct,
    id: string,
    props: ContainerDefinitionConstructProps,
  ) {
    super(scope, id);

    const appName = `${props.appName}-${props.deploymentEnvironment}-container-definition`;

    const defaultContainerDefinitionConfig = {
      logging: LogDriver.awsLogs({
        streamPrefix: appName,
      }),
    };

    const containerDefinitionProps: ContainerDefinitionProps = merge(
      defaultContainerDefinitionConfig,
      props.containerDefinitionProps,
    );
    this.containerDefinition = new ContainerDefinition(
      this,
      appName,
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
