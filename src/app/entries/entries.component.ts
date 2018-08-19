import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../util/web3.service';
import { MatSnackBar, MatDialog } from '@angular/material';
import { DetailsComponent } from './details/details.component';

declare let require: any;
const entryStorageArtifacts = require('../../../build/contracts/EntryStorage.json');

@Component({
  selector: 'app-entries',
  templateUrl: './entries.component.html',
  styleUrls: ['./entries.component.css']
})
export class EntriesComponent implements OnInit {
  EntryStorage: any;
  entries: any;
  entryCount: number;
  account: string;

  constructor(
    private web3Service: Web3Service,
    private matSnackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
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
      this.getEntries();
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

  getDate(unix_timestamp: number): Date {
    return new Date(unix_timestamp * 1000);
  }

  async getEntries() {
    console.log('Get entries...');
    this.entries = [];

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
          unsafeCreatedTimestamp: this.getDate(entry[3].toNumber()),
          submissionCount: entry[4].toNumber(),
          state: this.getState(entry[5].toNumber()),
          isBountyCollected: entry[6]
        });
      }
      this.entries.reverse();
    } catch (e) {
      console.log(e);
      this.setStatus(e.message + ' See log for more info');
    }
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, { duration: 5000 });
  }

  openDialog(entry): void {
    const dialogRef = this.dialog.open(DetailsComponent, {
      width: '800px',
      data: {
        entry: entry,
        account: this.account
      }
    });

    // dialogRef.afterClosed().subscribe(result => {
    //  console.log('The dialog was closed');
    //  this.animal = result;
    // });
  }
}
