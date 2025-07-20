import catchAsync from '../../../middleware/catch-async';
import { Request, Response } from 'express';
import { User } from '../../../db/models/user.model';
import { Document } from '../../../db/models/document.model';
import { DocumentUser } from '../../../db/models/document-user.model';
import { validationResult } from 'express-validator';
import { mailService } from '../../../services/mail.service';
import env from '../../../config/env.config';

class ShareController {
  public create = catchAsync(async (req: Request, res: Response) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(400).json(err);
    }

    const { id } = req.params;
    const document = await Document.findByPk(id);

    if (!document) return res.status(400).json({ message: 'Document not found' });

    // Only the original creator can share the document
    if (!req.user?.id || document.userId !== parseInt(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized to share this document' });
    }

    const { email, permission } = req.body;
    const sharedUser = await User.findOne({ where: { email } });

    if (!sharedUser) return res.status(400).json({ message: 'User not found' });

    const documentUser = await DocumentUser.create({
      documentId: id,
      userId: sharedUser.id,
      permission,
    });

    const mail = {
      from: process.env.SMTP_USER || 'sakshamkaseraa@gmail.com',
      to: sharedUser.email,
      subject: `${req.user.email} shared a document with you!`,
      text: `Click the link to view/edit the document: ${env.FRONT_END_URL}/document/${id}`,
    };

    try {
      await mailService.sendMail(mail);
      console.log(`📧 Share email sent to ${sharedUser.email}`);
    } catch (err) {
      console.error(`❌ Failed to send share email to ${sharedUser.email}`, err);
      // Optionally return 500, but we can still consider sharing success
    }

    return res.status(201).json(documentUser);
  });

  public delete = catchAsync(async (req: Request, res: Response) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(400).json(err);
    }

    const { documentId, userId } = req.params;

    const document = await Document.findOne({
      where: {
        id: documentId,
        userId: req.user?.id,
      },
    });

    if (!document) {
      return res.status(400).json({ message: 'Document not found or not owned by user' });
    }

    const query = {
      where: {
        documentId,
        userId,
      },
    };

    const documentUser = await DocumentUser.findOne(query);
    if (!documentUser) {
      return res.status(400).json({ message: 'User not shared with document' });
    }

    await DocumentUser.destroy(query);

    return res.sendStatus(200);
  });
}

const shareController = new ShareController();
export { shareController };
