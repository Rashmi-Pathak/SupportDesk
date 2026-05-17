/**
 * SUPPORTDESK CRM — ATTACHMENT CONTROLLER
 * Uploads files to Google Drive and records metadata.
 */
const AttachmentController = {
  upload: function (params) {
    var data = params.data || params;
    Validator.requireFields(data, ['ticketId', 'fileName', 'content', 'mimeType']);

    var folder;
    var folders = DriveApp.getFoldersByName('CRM_ATTACHMENTS');
    if (folders.hasNext()) { folder = folders.next(); }
    else { folder = DriveApp.createFolder('CRM_ATTACHMENTS'); }

    var decoded = Utilities.base64Decode(data.content);
    var blob = Utilities.newBlob(decoded, data.mimeType, data.fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var att = {
      attachmentId: Helpers.generateId('ATT', 8),
      ticketId:     data.ticketId,
      fileName:     data.fileName,
      fileUrl:      file.getUrl(),
      mimeType:     data.mimeType,
      uploadedBy:   data.uploadedBy || params._currentAgentName || 'Agent',
      createdAt:    new Date().toISOString()
    };

    var dao = new SheetDAO(CONFIG.SHEETS.ATTACHMENTS, CONFIG.COLUMNS.ATTACHMENTS);
    dao.insert(att, false);

    ActivityLogService.log(data.ticketId, params._currentAgentId || '', params._currentAgentName || '', 'Attachment Added', { fileName: data.fileName });

    return Response.success(att);
  },

  getByTicket: function (params) {
    Validator.requireFields(params, ['ticketId']);
    var dao = new SheetDAO(CONFIG.SHEETS.ATTACHMENTS, CONFIG.COLUMNS.ATTACHMENTS);
    var atts = dao.findWhere(function (a) { return a.ticketId === params.ticketId; });
    return Response.success(atts);
  }
};
