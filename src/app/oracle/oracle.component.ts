import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../util/web3.service';
import { MatSnackBar, MatDialog } from '@angular/material';

declare let require: any;
const oracleArtifacts = require('../../../build/contracts/EthPriceOracle.json');

@Component({
  selector: 'app-oracle',
  templateUrl: './oracle.component.html',
  styleUrls: ['./oracle.component.css']
})
export class OracleComponent implements OnInit {
  account: string;
  EthPriceOracle: any;
  price = 0;

  constructor(
    private web3Service: Web3Service,
    private matSnackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.watchAccount();
    this.web3Service
      .artifactsToContract(oracleArtifacts)
      .then(EthPriceOracleAbstraction => {
        this.EthPriceOracle = EthPriceOracleAbstraction;
      });
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe(accounts => {
      this.account = accounts[0];
    });
  }

  async getEthPrice() {
    if (!this.EthPriceOracle) {
      this.setStatus(
        'EthPriceOracle contract is not loaded, unable to get the ETH price'
      );
      return;
    }
    this.setStatus('Getting the ETH price, please wait');
    try {
      const deployedEthPriceOracle = await this.EthPriceOracle.deployed();
      const price = await deployedEthPriceOracle.getEthPrice();
      this.price = price.toNumber();
    } catch (e) {
      console.log(e);
      this.setStatus(e.message + ' See log for more info');
    }
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, { duration: 5000 });
  }
}
