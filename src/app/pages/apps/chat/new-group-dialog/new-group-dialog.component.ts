import { Component, Inject, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import {  CreateGroupStyle } from '@cometchat/chat-uikit-angular';
import "@cometchat/uikit-elements";

@Component({
  selector: 'app-new-group-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './new-group-dialog.component.html',
  styleUrl: './new-group-dialog.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NewGroupDialogComponent {
  ccGroupCreated: any;
  createGroupStyle = new CreateGroupStyle({
    titleTextFont: 'Montserrat',
    createGroupButtonBackground: '#92b46c',
    height: "250px",
  });

  constructor(
    private dialogRef: MatDialogRef<NewGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  public handleCloseCallback = ()=>{
    this.dialogRef.close({ event: 'Cancel' });
  };

  onGroupCreated(event: any) {
    this.dialogRef.close({ group: event.detail, event: 'Create' });
  }
}