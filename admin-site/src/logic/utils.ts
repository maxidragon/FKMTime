import { Competition } from "@wca/helpers";
import regions from "./regions";
import { Attempt } from "./interfaces";

export const calculateTotalPages = (count: number, pageSize: number) => {
  return Math.ceil(count / pageSize);
};

export const prettyGender = (gender: string) => {
  switch (gender) {
    case "m":
      return "Male";
    case "f":
      return "Female";
    default:
      return "Other";
  }
};

export const regionNameByIso2 = (iso2: string) => {
  return regions.find((region) => region.iso2 === iso2)?.name;
};

export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
  const minutes =
    date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
  return `${hours}:${minutes}`;
};

export const getPersonFromWcif = (registrantId: number, wcif: Competition) => {
  return wcif.persons.find((person) => person.registrantId === registrantId);
};

export const getEventIdFromRoundId = (roundId: string) => {
  return roundId.split("-")[0];
};

export const getRoundIdFromGroupId = (groupId: string) => {
  return groupId.split("-")[0];
};

export const getRoundInfoFromWcif = (roundId: string, wcif: Competition) => {
  const eventId = getEventIdFromRoundId(roundId);
  const event = wcif.events.find((event) => event.id === eventId);
  return event?.rounds.find((round) => round.id === roundId);
};

export const getCutoffByRoundId = (roundId: string, wcif: Competition) => {
  const round = getRoundInfoFromWcif(roundId, wcif);
  return round?.cutoff || null;
};

export const getLimitByRoundId = (roundId: string, wcif: Competition) => {
  const round = getRoundInfoFromWcif(roundId, wcif);
  return round?.timeLimit || null;
};

export const getPrettyCompetitionEndDate = (
  startDate: string,
  numberOfDays: number
) => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + numberOfDays - 1);
  return date.toLocaleDateString();
};

export const getNumberOfAttemptsForRound = (
  roundId: string,
  wcif: Competition
): number => {
  const round = getRoundInfoFromWcif(roundId, wcif);
  if (!round) return 0;
  switch (round.format) {
    case "1":
      return 1;
    case "2":
      return 2;
    case "3":
      return 3;
    case "a":
      return 5;
    case "m":
      return 3;
  }
};

export const prettyRoundFormat = (format: string, cutoffAttempts?: number) => {
  switch (format) {
    case "1":
      return "Best of 1";
    case "2":
      return "Best of 2";
    case "3":
      return "Best of 3";
    case "a":
      if (!cutoffAttempts) {
        return `Average of 5`;
      }
      return `Best of ${cutoffAttempts} / Average of 5`;
    case "m":
      return "Mean of 3";
  }
};

export const getSubmittedAttempts = (attempts: Attempt[]) => {
  const attemptsToReturn: Attempt[] = [];
  attempts.forEach((attempt) => {
    if (
      attempt.replacedBy === null &&
      !attempt.extraGiven &&
      !attemptsToReturn.some((a) => a.id === attempt.id) &&
      !attempt.isExtraAttempt
    )
      attemptsToReturn.push(attempt);
    if (attempt.replacedBy !== null && attempt.extraGiven) {
      const extraAttempt = attempts.find(
        (a) =>
          a.attemptNumber === attempt.replacedBy && a.isExtraAttempt === true
      );
      if (
        extraAttempt &&
        !attemptsToReturn.some((a) => a.id === extraAttempt.id)
      ) {
        attemptsToReturn.push(extraAttempt);
      }
    }
  });
  return attemptsToReturn.sort((a, b) => a.attemptNumber - b.attemptNumber);
};

export const getRoundNameById = (roundId: string, wcif?: Competition) => {
  if (!wcif) return "";
  let roundName = "";
  wcif.schedule?.venues.forEach((venue) => {
    venue.rooms.forEach((room) => {
      room.activities.forEach((activity) => {
        if (activity.activityCode === roundId) {
          roundName = activity.name;
        }
      });
    });
  });
  return roundName;
};
