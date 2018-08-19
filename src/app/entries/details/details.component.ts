import { Component, OnInit, Inject } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { EntriesComponent } from '../entries.component';

declare let require: any;
const entryStorageArtifacts = require('../../../../build/contracts/EntryStorage.json');

export interface DialogData {
  entry: any;
  account: string;
}

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {
  entry: any;
  account: string;
  EntryStorage: any;
  submissions: any;

  constructor(
    private web3Service: Web3Service,
    private matSnackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EntriesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.entry = data.entry;
    this.account = data.account;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.web3Service
      .artifactsToContract(entryStorageArtifacts)
      .then(EntryStorageAbstraction => {
        this.EntryStorage = EntryStorageAbstraction;
        if (this.entry.submissionCount > 0) {
          this.getSubmissions();
        }
      });
  }

  async getSubmissions() {
    console.log('Get submissions...');
    this.submissions = [];
    try {
      const deployedEntryStorage = await this.EntryStorage.deployed();
      const entryId = this.entry.id;
      const noSubmissions = this.entry.submissionCount;
      for (let i = 1; i <= noSubmissions; i++) {
        const entry = await deployedEntryStorage.getSubmission.call(entryId, i);
        this.submissions.push({
          id: entry[0].toNumber(),
          owner: entry[1],
          unsafeCreatedTimestamp: this.getDate(entry[2].toNumber())
        });
      }
      this.submissions.reverse();
    } catch (e) {
      console.log(e);
      this.setStatus(e.message + ' See log for more info');
    }
  }

  async accept(submission: any) {
    this.setStatus('Accepting submission, please wait');

    try {
      const deployedEntryStorage = await this.EntryStorage.deployed();
      const transaction = await deployedEntryStorage.acceptSubmission.sendTransaction(
        this.entry.id,
        submission.id,
        { from: this.account }
      );

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

  async submit() {
    if (!this.EntryStorage) {
      this.setStatus(
        'EntryStorage contract is not loaded, unable to submit work'
      );
      return;
    }
    this.setStatus('Submiting work, please wait');
    try {
      const deployedEntryStorage = await this.EntryStorage.deployed();
      const transaction = await deployedEntryStorage.submit.sendTransaction(
        this.entry.id,
        { from: this.account }
      );

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

  async cancelEntry() {
    if (!this.EntryStorage) {
      this.setStatus(
        'EntryStorage contract is not loaded, unable to cancel a entry'
      );
      return;
    }
    this.setStatus('Canceling entry, please wait');
    try {
      const deployedEntryStorage = await this.EntryStorage.deployed();
      const transaction = await deployedEntryStorage.cancelEntry.sendTransaction(
        this.entry.id,
        { from: this.account }
      );

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

  getDate(unix_timestamp: number): Date {
    return new Date(unix_timestamp * 1000);
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, { duration: 5000 });
  }
}
