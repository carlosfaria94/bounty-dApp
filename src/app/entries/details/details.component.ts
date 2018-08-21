import { Component, OnInit, Inject } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { EntriesComponent } from '../entries.component';
import { IpfsService } from '../../util/ipfs.service';
import { MultihashService } from '../../util/multihash.service';
import { UPortService } from '../../util/u-port.service';

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
  submitting = false;
  fileToUpload: any;
  spec = {
    description: '',
    additionalFile: '',
    uPortName: '',
    uPortAvatar: ''
  };

  constructor(
    private web3Service: Web3Service,
    private matSnackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EntriesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private ipfsService: IpfsService,
    private multihashService: MultihashService,
    private uPortService: UPortService
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
        if (this.entry.state === 'Done') {
          this.getAcceptedSubmission();
        }
      });
  }

  async getSubmissions() {
    console.log('Geting submissions...');
    this.submissions = [];
    try {
      const deployedEntryStorage = await this.EntryStorage.deployed();
      const entryId = this.entry.id;
      const noSubmissions = this.entry.submissionCount;
      for (let i = 1; i <= noSubmissions; i++) {
        const entry = await deployedEntryStorage.getSubmission.call(entryId, i);
        const specHash = this.multihashService.getMultihashFromBytes32(
          entry[2],
          entry[3].toNumber(),
          entry[4].toNumber()
        );
        const spec = await this.ipfsService.getObject(specHash);
        if (spec.additionalFile) {
          spec.additionalFile = `https://ipfs.infura.io/ipfs/${
            spec.additionalFile
          }`;
        }
        this.submissions.push({
          id: entry[0].toNumber(),
          owner: entry[1],
          spec: spec,
          unsafeCreatedTimestamp: this.getDate(entry[5].toNumber())
        });
      }
      this.submissions.reverse();
    } catch (e) {
      console.log(e);
      this.setStatus(e.message + ' See log for more info');
    }
  }

  async getAcceptedSubmission() {
    console.log('Geting accepted submission...');
    try {
      const deployedEntryStorage = await this.EntryStorage.deployed();
      const entryId = this.entry.id;
      const acceptedSubmission = await deployedEntryStorage.getAcceptedSubmission.call(
        entryId
      );
      const specHash = this.multihashService.getMultihashFromBytes32(
        acceptedSubmission[2],
        acceptedSubmission[3].toNumber(),
        acceptedSubmission[4].toNumber()
      );
      const spec = await this.ipfsService.getObject(specHash);
      if (spec.additionalFile) {
        spec.additionalFile = `https://ipfs.infura.io/ipfs/${
          spec.additionalFile
        }`;
      }
      this.entry.acceptedSubmission = {
        id: acceptedSubmission[0].toNumber(),
        owner: acceptedSubmission[1],
        spec: spec,
        unsafeCreatedTimestamp: this.getDate(acceptedSubmission[5].toNumber())
      };
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
    this.submitting = true;
    if (!this.EntryStorage) {
      this.setStatus(
        'EntryStorage contract is not loaded, unable to submit work'
      );
      return;
    }
    if (this.spec.description === '') {
      this.setStatus('Description is not set');
      return;
    }
    this.setStatus('Submiting work, please wait');
    this.setUportCredentials();
    try {
      if (this.fileToUpload) {
        const additionalFile = await this.ipfsService.uploadFile(
          this.fileToUpload
        );
        // Add the IPFS file hash on the entry specification
        this.spec.additionalFile = additionalFile;
      } else {
        delete this.spec.additionalFile;
      }
      const specHash = await this.ipfsService.uploadObject(this.spec);
      const specMultiHash = this.multihashService.getBytes32FromMultiash(
        specHash
      );
      const deployedEntryStorage = await this.EntryStorage.deployed();
      const transaction = await deployedEntryStorage.submit.sendTransaction(
        this.entry.id,
        specMultiHash.digest,
        specMultiHash.hashFunction,
        specMultiHash.size,
        { from: this.account }
      );

      if (!transaction) {
        this.setStatus('Transaction failed!');
      } else {
        this.setStatus('Transaction complete!');
      }
      this.submitting = false;
    } catch (e) {
      console.log(e);
      this.setStatus(e.message + ' See log for more info');
      this.submitting = false;
    }
  }

  async claimBounty() {
    if (!this.EntryStorage) {
      this.setStatus(
        'EntryStorage contract is not loaded, unable to claim the bounty'
      );
      return;
    }
    this.setStatus('Claiming the bounty, please wait');
    try {
      const deployedEntryStorage = await this.EntryStorage.deployed();
      const transaction = await deployedEntryStorage.claimBounty.sendTransaction(
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

  setDescription(e) {
    console.log('Setting spec description: ' + e.target.value);
    this.spec.description = e.target.value;
  }

  setUportCredentials() {
    const credentials = this.uPortService.credentials;
    if (!credentials) {
      return;
    }
    if (credentials.avatar.uri) {
      this.spec.uPortAvatar = credentials.avatar.uri;
    }
    if (credentials.name) {
      this.spec.uPortName = credentials.name;
    }
  }

  handleFileInput(e) {
    const reader = new FileReader();
    reader.onloadend = async () => {
      this.fileToUpload = reader.result;
    };
    reader.readAsArrayBuffer(e.files[0]);
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, { duration: 5000 });
  }
}
