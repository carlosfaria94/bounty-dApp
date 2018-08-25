import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../util/web3.service';
import { MatSnackBar, MatDialog } from '@angular/material';
import { DetailsComponent } from './details/details.component';
import { MultihashService } from '../util/multihash.service';
import { IpfsService } from '../util/ipfs.service';

@Component({
  selector: 'app-entries',
  templateUrl: './entries.component.html',
  styleUrls: ['./entries.component.css']
})
export class EntriesComponent implements OnInit {
  organisation: any;
  entries: any;
  entryCount: number;
  account: string;

  constructor(
    private web3Service: Web3Service,
    private matSnackBar: MatSnackBar,
    public dialog: MatDialog,
    private multihashService: MultihashService,
    private ipfsService: IpfsService
  ) {}

  ngOnInit() {
    this.watchAccount();
    this.setContract();
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe(accounts => {
      this.account = accounts[0];
      this.getEntries();
    });
  }

  async setContract() {
    try {
      const contract = await this.web3Service.artifactsToContract(
        this.web3Service.organisationArtifacts
      );
      this.organisation = await contract.deployed();
    } catch (e) {
      console.log(e);
      this.setStatus(e.message + ' See log for more info');
    }
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
      const noEntries = await this.organisation.getEntryCount();
      console.log(`We have ${noEntries} entries`);
      for (let i = 1; i <= noEntries.toNumber(); i++) {
        const entry = await this.organisation.getEntry.call(i);
        const specHash = this.multihashService.getMultihashFromBytes32(
          entry[3],
          entry[4].toNumber(),
          entry[5].toNumber()
        );
        const spec = await this.ipfsService.getObject(specHash);
        if (spec.additionalFile) {
          spec.additionalFile = `https://ipfs.infura.io/ipfs/${
            spec.additionalFile
          }`;
        }
        this.entries.push({
          id: entry[0].toNumber(),
          owner: entry[1],
          bounty: this.web3Service.web3.utils.fromWei(
            entry[2].toString(),
            'ether'
          ),
          spec: spec,
          unsafeCreatedTimestamp: this.getDate(entry[6].toNumber()),
          submissionCount: entry[7].toNumber(),
          state: this.getState(entry[8].toNumber()),
          isBountyCollected: entry[9]
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
  }
}
