import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../util/web3.service';
import { MatSnackBar } from '@angular/material';

declare let require: any;
const entryStorageArtifacts = require('../../../build/contracts/EntryStorage.json');

@Component({
  selector: 'app-new-entry',
  templateUrl: './new-entry.component.html',
  styleUrls: ['./new-entry.component.css']
})
export class NewEntryComponent implements OnInit {
  accounts: string[];
  EntryStorage: any;
  model = {
    bounty: 0,
    account: ''
  };
  status = '';

  constructor(
    private web3Service: Web3Service,
    private matSnackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.watchAccount();
    this.web3Service
      .artifactsToContract(entryStorageArtifacts)
      .then(EntryStorageAbstraction => {
        this.EntryStorage = EntryStorageAbstraction;
      });
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe(accounts => {
      this.accounts = accounts;
      console.log(accounts);
      this.model.account = accounts[0];
    });
  }

  async createBounty() {
    if (!this.EntryStorage) {
      this.setStatus(
        'EntryStorage contract is not loaded, unable to create a bounty'
      );
      return;
    }
    const bounty = this.model.bounty;
    if (!bounty) {
      this.setStatus('Bounty is not set');
      return;
    }

    this.setStatus('Creating bounty, please wait');

    try {
      const deployedEntryStorage = await this.EntryStorage.deployed();
      const transaction = await deployedEntryStorage.addEntry.sendTransaction({
        value: this.web3Service.web3.utils.toWei(this.model.bounty, 'ether'),
        from: this.model.account
      });

      if (!transaction) {
        this.setStatus('Transaction failed!');
      } else {
        this.setStatus('Transaction complete!');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error sending coin; see log.');
    }
  }

  setBounty(e) {
    console.log('Setting amount: ' + e.target.value);
    this.model.bounty = e.target.value;
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, { duration: 3000 });
  }
}
