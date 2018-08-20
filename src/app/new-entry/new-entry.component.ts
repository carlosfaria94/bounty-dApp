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
  spec = {
    description: '',
    bounty: 0,
    additionalFile: ''
  };
  creatingBounty = false;
  fileToUpload: any;

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
    this.creatingBounty = true;
    if (!this.EntryStorage) {
      this.setStatus(
        'EntryStorage contract is not loaded, unable to create a bounty'
      );
      return;
    }
    if (!this.spec.bounty) {
      this.setStatus('Bounty is not set');
      return;
    }
    if (this.spec.description === '') {
      this.setStatus('Specification is not set');
      return;
    }

    this.setStatus('Creating bounty, please wait');

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
      const transaction = await deployedEntryStorage.addEntry.sendTransaction(
        specMultiHash.digest,
        specMultiHash.hashFunction,
        specMultiHash.size,
        {
          value: this.web3Service.web3.utils.toWei(this.spec.bounty, 'ether'),
          from: this.account
        }
      );

      if (!transaction) {
        this.setStatus('Transaction failed!');
      } else {
        this.setStatus('Transaction complete!');
      }
      this.creatingBounty = false;
    } catch (e) {
      console.log(e);
      this.setStatus(e.message + ' See log for more info');
      this.creatingBounty = false;
    }
  }

  setBounty(e) {
    console.log('Setting amount: ' + e.target.value);
    this.spec.bounty = e.target.value;
  }

  setDescription(e) {
    console.log('Setting spec: ' + e.target.value);
    this.spec.description = e.target.value;
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
