import { merge } from 'lodash';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import {
  FileSystem,
  FileSystemProps,
  LifecyclePolicy,
  PerformanceMode,
  ThroughputMode,
} from 'aws-cdk-lib/aws-efs';
import {
  AnyPrincipal,
  PolicyStatement,
  PolicyStatementProps,
} from 'aws-cdk-lib/aws-iam';
import { AppProps } from '@/lib/common/shared/types';

export interface EfsConstructProps extends AppProps {
  fileSystemProps: FileSystemProps;
}

const defaultFileSystemProps = {
  encrypted: true,
  lifecyclePolicy: LifecyclePolicy.AFTER_14_DAYS,
  performanceMode: PerformanceMode.GENERAL_PURPOSE,
  throughputMode: ThroughputMode.BURSTING,
  removalPolicy: RemovalPolicy.DESTROY,
};
const defaultEfsResourcePolicyStatement: PolicyStatementProps = {
  actions: ['elasticfilesystem:ClientMount'],
  principals: [new AnyPrincipal()],
  conditions: {
    Bool: {
      'elasticfilesystem:AccessedViaMountTarget': 'true',
    },
  },
};

export class EfsConstruct extends Construct {
  readonly fileSystem: FileSystem;

  constructor(scope: Construct, id: string, props: EfsConstructProps) {
    super(scope, id);

    const appName = `${props.appName}-${props.deploymentEnvironment}`;

    const fileSystemProps = merge(
      defaultFileSystemProps,
      props.fileSystemProps,
    );
    this.fileSystem = new FileSystem(
      this,
      `${appName}efs-file-system`,
      fileSystemProps,
    );

    this.fileSystem.addToResourcePolicy(
      new PolicyStatement(defaultEfsResourcePolicyStatement),
    );
  }
}
