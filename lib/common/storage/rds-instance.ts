import { merge } from 'lodash';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  DatabaseInstanceProps,
  MysqlEngineVersion,
} from 'aws-cdk-lib/aws-rds';
import { SecretConstruct } from '../auth';
import {
  DEFAULT_RDS_DB_NAME,
  DEFAULT_RDS_PORT,
  DEFAULT_RDS_USER,
} from '../shared';

export interface RdsInstanceProps {
  rdsInstanceProps: Omit<DatabaseInstanceProps, 'engine'>;
  dbUserName?: string;
}

const defaultRdsInstanceProps: Omit<DatabaseInstanceProps, 'vpc'> = {
  multiAz: true,
  vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
  engine: DatabaseInstanceEngine.mysql({
    version: MysqlEngineVersion.VER_8_0_35,
  }),
  instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
  storageEncrypted: true,
  iamAuthentication: true,
  deletionProtection: false,
  removalPolicy: RemovalPolicy.DESTROY,
  port: DEFAULT_RDS_PORT,
  databaseName: DEFAULT_RDS_DB_NAME,
};

export class RdsInstanceConstruct extends Construct {
  readonly db: DatabaseInstance;
  readonly dbSecret: Secret;
  constructor(scope: Construct, id: string, props: RdsInstanceProps) {
    super(scope, id);

    this.dbSecret = new SecretConstruct(this, 'rds-instance-secret').secret;

    const dbInstanceProps: DatabaseInstanceProps = merge(
      defaultRdsInstanceProps,
      {
        credentials: Credentials.fromPassword(
          props.dbUserName ?? DEFAULT_RDS_USER,
          this.dbSecret.secretValue,
        ),
      },
      props.rdsInstanceProps,
    );

    this.db = new DatabaseInstance(this, 'rds-instance', dbInstanceProps);
  }
}
