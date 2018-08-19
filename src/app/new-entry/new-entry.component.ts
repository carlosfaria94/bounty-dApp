import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../util/web3.service';
import { MatSnackBar } from '@angular/material';
import { IpfsService } from '../util/ipfs.service';
import { MultihashService } from '../util/multihash.service';

declare let require: any;
const entryStorageArtifacts = require('../../../build/contracts/EntryStorage.json');

@Component({
  selector: 'app-new-entry',
  templateUrl: './new-entry.component.html',
  styleUrls: ['./new-entry.component.css']
})
export class NewEntryComponent implements OnInit {
  account = '';
  EntryStorage: any;
  entry = {
    bounty: 0,
    specification: ''
  };

  constructor(
    private web3Service: Web3Service,
    private matSnackBar: MatSnackBar,
    private ipfsService: IpfsService,
    private multihashService: MultihashService
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
      this.account = accounts[0];
    });
  }

  async createBounty() {
    if (!this.EntryStorage) {
      this.setStatus(
        'EntryStorage contract is not loaded, unable to create a bounty'
      );
      return;
    }
    if (!this.entry.bounty) {
      this.setStatus('Bounty is not set');
      return;
    }
    if (this.entry.specification === '') {
      this.setStatus('Specification is not set');
      return;
    }

    this.setStatus('Creating bounty, please wait');
    const infoHash = await this.ipfsService.uploadObject(this.entry);
    const entryMultiHash = this.multihashService.getBytes32FromMultiash(
      infoHash
    );
    console.log('entryMultiHash', entryMultiHash);

    try {
      const deployedEntryStorage = await this.EntryStorage.deployed();
      const transaction = await deployedEntryStorage.addEntry.sendTransaction({
        value: this.web3Service.web3.utils.toWei(this.entry.bounty, 'ether'),
        from: this.account
      });

      if (!transaction) {
        this.setStatus('Transaction failed!');
      } else {
        this.setStatus('Transaction complete!');
      }
    } catch (e) {
      console.log(e);
      this.setStatus(e.message + ' See log for more info');
    }
  }

  setBounty(e) {
    console.log('Setting amount: ' + e.target.value);
    this.entry.bounty = e.target.value;
  }

  setSpecification(e) {
    console.log('Setting spec: ' + e.target.value);
    this.entry.specification = e.target.value;
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, { duration: 5000 });
  }
}
