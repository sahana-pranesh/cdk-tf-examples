import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput, RemoteBackend } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { Vpc } from "./.gen/modules/vpc";

class AwsStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      region: "us-west-1",
    });

    new Vpc(this, 'MyVpc', {
      name: 'my-vpc',
      cidr: '10.0.0.0/16',
      azs: ['us-west-1a', 'us-west-1c'],
      privateSubnets: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
      publicSubnets: ['10.0.101.0/24', '10.0.102.0/24', '10.0.103.0/24'],
      enableNatGateway: true }
    )

    const ec2Instance = new Instance(this, "compute", {
      ami: "ami-01456a894f71116f2",
      instanceType: "t2.micro",
    });

    new TerraformOutput(this, "public_ip", {
      value: ec2Instance.publicIp,
    });
  }
}

const app = new App();
const stack = new AwsStack(app, "aws_instance");

new RemoteBackend(stack, {
  hostname: "app.terraform.io",
  organization: "sahana-test",
  workspaces: {
    name: "cdktf",
  },
});

app.synth();
