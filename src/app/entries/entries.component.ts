import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../util/web3.service';
import { MatSnackBar } from '@angular/material';

declare let require: any;
const entryStorageArtifacts = require('../../../build/contracts/EntryStorage.json');

@Component({
  selector: 'app-entries',
  templateUrl: './entries.component.html',
  styleUrls: ['./entries.component.css']
})
export class EntriesComponent implements OnInit {
  EntryStorage: any;
  entries = [];
  entryCount: number;
  status = '';
  account: string;

  constructor(
    private web3Service: Web3Service,
    private matSnackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.watchAccount();
    this.web3Service
      .artifactsToContract(entryStorageArtifacts)
      .then(EntryStorageAbstraction => {
        this.EntryStorage = EntryStorageAbstraction;
        this.getEntries();
      });
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe(accounts => {
      this.account = accounts[0];
    });
  }

  getState(stateId: number): string {
    let state = '';
    switch (stateId) {
      case 0:
        state = 'Open';
        break;
      case 1:
        state = 'Submitted';
        break;
      case 2:
        state = 'Done';
        break;
      case 3:
        state = 'Canceled';
        break;
      default:
        break;
    }
    return state;
  }

  async getEntries() {
    console.log('Get entries...');

    try {
      const deployedEntryStorage = await this.EntryStorage.deployed();
      const noEntries = await deployedEntryStorage.entryCount();
      for (let i = 1; i <= noEntries.toNumber(); i++) {
        const entry = await deployedEntryStorage.getEntry.call(i);
        this.entries.push({
          id: entry[0].toNumber(),
          owner: entry[1],
          bounty: this.web3Service.web3.utils.fromWei(
            entry[2].toString(),
            'ether'
          ),
          unsafeCreatedTimestamp: entry[3].toNumber(),
          submissionCount: entry[4].toNumber(),
          state: this.getState(entry[5].toNumber())
        });
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error getting the list of entries. See log.');
    }
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, { duration: 3000 });
  }
}
