import mongoose from 'mongoose';

const mutualAgreementSchema = new mongoose.Schema(
  {
    agreementNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomListing',
      required: true,
    },
    seeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monthlyRent: {
      type: Number,
      required: true,
    },
    securityDeposit: {
      type: Number,
      required: true,
    },
    moveInDate: {
      type: Date,
      required: true,
    },
    stayDuration: {
      type: Number,
      default: 6,
    },
    occupantsCount: {
      type: Number,
      default: 1,
    },
    terms: {
      houseRules: {
        type: [String],
        default: [
          'Respect designated quiet hours and roommate personal space boundaries.',
          'Keep common shared areas (kitchen, living hall, bathrooms) clean and hygienic.',
          'No unauthorized subletting or secondary guest tenancies without written owner consent.',
          'Adhere to society bylaws, waste segregation protocols, and security guidelines.',
          'Prompt settlement of monthly utility splits (electricity, WiFi, water, gas).',
        ],
      },
      livingConditionsSummary: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    legalDisclaimer: {
      type: String,
      default:
        'RoomSync is a matchmaking platform. This mutual agreement records mutual consent between the room owner and seeker and does not constitute a registered lease agreement under the Transfer of Property Act or state rent control laws. The parties are advised to execute a formal registered rental agreement where required by local law.',
    },
    seekerAccepted: {
      type: Boolean,
      default: false,
    },
    seekerAcceptedAt: {
      type: Date,
      default: null,
    },
    seekerIp: {
      type: String,
      default: null,
    },
    ownerAccepted: {
      type: Boolean,
      default: false,
    },
    ownerAcceptedAt: {
      type: Date,
      default: null,
    },
    ownerIp: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending_signatures', 'completed', 'cancelled'],
      default: 'pending_signatures',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

mutualAgreementSchema.index({ booking: 1 });
mutualAgreementSchema.index({ room: 1 });
mutualAgreementSchema.index({ seeker: 1, status: 1 });
mutualAgreementSchema.index({ owner: 1, status: 1 });

const MutualAgreement = mongoose.model('MutualAgreement', mutualAgreementSchema);
export default MutualAgreement;

