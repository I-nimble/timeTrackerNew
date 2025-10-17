import { Component, Inject, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateGroupStyle } from '@cometchat/chat-uikit-angular';
import { CometChat } from '@cometchat/chat-sdk-javascript-new';
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
  closeCreateGroup: any;
  createGroupStyle = new CreateGroupStyle({
    titleTextFont: 'Montserrat',
    createGroupButtonBackground: '#92b46c',
    height: "300px",
  });
  
  constructor(
    private dialogRef: MatDialogRef<NewGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  public handleCloseCallback = () => {
    this.dialogRef.close({ event: 'Cancel' });
  };

  public onGroupCreated = (groupForm: any) => {
    const groupType = groupForm.type || CometChat.GROUP_TYPE.PUBLIC;
    const password = groupForm.password || '';
    const guid = groupForm.guid || 'group_' + Date.now();
    const icon = "https://inimble-app.s3.us-east-1.amazonaws.com/assets/images/group-icon.webp";

    const group: CometChat.Group = new CometChat.Group(
      guid,
      groupForm.name,
      groupType,
      password,
      icon
    );

    CometChat.createGroup(group).then(
      (createdGroup) => {
        this.dialogRef.close({ group: createdGroup, event: 'Create' });
      },
      (error) => {
        console.error('Group creation failed: ' + error.message);
      }
    );
  };
}