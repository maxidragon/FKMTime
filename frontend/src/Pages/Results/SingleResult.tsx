import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getResultById, reSubmitScorecardToWcaLive } from "../../logic/results";
import LoadingPage from "../../Components/LoadingPage";
import { Result } from "../../logic/interfaces";
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Heading,
    IconButton,
    Text,
    useToast,
} from "@chakra-ui/react";
import regions from "../../logic/regions";
import AttemptsTable from "../../Components/Table/AttemptsTable";
import {
    getCutoffByRoundId,
    getLimitByRoundId,
    getNumberOfAttemptsForRound,
    getRoundNameById,
    getSubmittedAttempts,
    isThereADifferenceBetweenResults,
} from "../../logic/utils";
import { useAtom } from "jotai";
import { competitionAtom } from "../../logic/atoms";
import { resultToString } from "../../logic/resultFormatters";
import { getCompetitionInfo } from "../../logic/competition";
import { MdAdd } from "react-icons/md";
import CreateAttemptModal from "../../Components/Modal/CreateAttemptForm.tsx";
import SwapAttemptsModal from "../../Components/Modal/SwapAttemptsModal.tsx";

const SingleResult = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const [competition, setCompetition] = useAtom(competitionAtom);
    const [result, setResult] = useState<Result | null>(null);
    const [isOpenCreateAttemptModal, setIsOpenCreateAttemptModal] =
        useState<boolean>(false);
    const [isOpenSwapAttemptsModal, setIsOpenSwapAttemptsModal] =
        useState<boolean>(false);
    const standardAttempts = useMemo(() => {
        if (!result) return [];
        return (
            result.attempts
                .filter((attempt) => !attempt.isExtraAttempt)
                .sort((a, b) => a.attemptNumber - b.attemptNumber) || []
        );
    }, [result]);
    const extraAttempts = useMemo(() => {
        if (!result) return [];
        return (
            result.attempts.filter((attempt) => attempt.isExtraAttempt) || []
        );
    }, [result]);
    const submittedAttempts = useMemo(() => {
        if (!result) return [];
        return getSubmittedAttempts(result.attempts);
    }, [result]);

    const isDifferenceBetweenResults = useMemo(() => {
        if (!result || !competition) return false;
        return isThereADifferenceBetweenResults(
            result,
            submittedAttempts,
            competition.wcif
        );
    }, [competition, result, submittedAttempts]);

    const cutoff = useMemo(() => {
        if (!competition || !result) {
            return null;
        }
        return getCutoffByRoundId(result.roundId, competition.wcif);
    }, [competition, result]);
    const limit = useMemo(() => {
        if (!competition || !result) {
            return null;
        }
        return getLimitByRoundId(result.roundId, competition.wcif);
    }, [competition, result]);

    const maxAttempts = useMemo(() => {
        if (!competition || !result) {
            return 0;
        }
        return getNumberOfAttemptsForRound(result.roundId, competition.wcif);
    }, [competition, result]);

    const fetchData = useCallback(async () => {
        if (!id) return;
        if (!competition) {
            const competitionData = await getCompetitionInfo();
            setCompetition(competitionData.data);
        }
        const response = await getResultById(id);
        if (response.status === 404) {
            toast({
                title: "Error",
                description: "Result not found",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            navigate("/results");
        }
        setResult(response.data);
    }, [competition, id, navigate, setCompetition, toast]);

    const handleResubmit = async () => {
        if (!result) return;
        const status = await reSubmitScorecardToWcaLive(result.id);
        if (status === 200) {
            toast({
                title: "Success",
                description: "Scorecard resubmitted to WCA Live",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Error",
                description: "Something went wrong",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleCloseModal = () => {
        fetchData();
        setIsOpenCreateAttemptModal(false);
        setIsOpenSwapAttemptsModal(false);
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!result) return <LoadingPage />;

    return (
        <Box display="flex" flexDirection="column" gap={3}>
            <Heading>Competitor</Heading>
            <Text fontSize="xl">Name: {result.person.name}</Text>
            <Text fontSize="xl">
                Registrant ID: {result.person.registrantId}
            </Text>
            <Text fontSize="xl">WCA ID: {result.person.wcaId}</Text>
            <Text fontSize="xl">
                Representing:{" "}
                {
                    regions.find(
                        (region) => region.iso2 === result.person.countryIso2
                    )?.name
                }
            </Text>
            <Button
                colorScheme="yellow"
                width={{ base: "100%", md: "20%" }}
                onClick={handleResubmit}
            >
                Resubmit scorecard to WCA Live
            </Button>
            {isDifferenceBetweenResults && (
                <Alert status="error" color="black">
                    <AlertIcon />
                    There is a difference between results in WCA Live and FKM.
                    Please check it manually, fix in FKM and resubmit scorecard
                    to WCA Live.
                </Alert>
            )}
            <Heading mt={3}>
                Limits for {getRoundNameById(result.roundId, competition?.wcif)}
            </Heading>
            <Text fontSize="xl">
                Cutoff:{" "}
                {cutoff
                    ? `${resultToString(cutoff.attemptResult)} (${cutoff.numberOfAttempts} attempts)`
                    : "None"}
            </Text>
            <Text fontSize="xl">
                Limit:{" "}
                {limit
                    ? `${resultToString(limit.centiseconds)} ${limit.cumulativeRoundIds.length > 0 ? "(cumulative)" : ""}`
                    : "None"}
            </Text>
            <Text fontSize="xl">Attempts: {maxAttempts}</Text>
            <Box display="flex" gap="5" alignItems="center">
                <Heading mt={3}>Attempts</Heading>
                <IconButton
                    icon={<MdAdd />}
                    aria-label="Add"
                    bg="white"
                    color="black"
                    rounded="20"
                    width="5"
                    height="10"
                    _hover={{
                        background: "white",
                        color: "gray.700",
                    }}
                    onClick={() => setIsOpenCreateAttemptModal(true)}
                />
            </Box>
            <Heading size="md">List of attempts submitted to WCA Live</Heading>
            {submittedAttempts.length === 0 ? (
                <Text>No attempts submitted to WCA Live</Text>
            ) : (
                <AttemptsTable
                    attempts={submittedAttempts as never}
                    fetchData={fetchData}
                    result={result}
                />
            )}
            <Heading size="md">Standard</Heading>
            <Button
                colorScheme="yellow"
                onClick={() => setIsOpenSwapAttemptsModal(true)}
                width={{ base: "100%", md: "20%" }}
            >
                Swap attempts
            </Button>
            {standardAttempts.length === 0 ? (
                <Text>No attempts</Text>
            ) : (
                <AttemptsTable
                    attempts={standardAttempts}
                    showExtraColumns
                    fetchData={fetchData}
                    result={result}
                />
            )}
            <Heading size="md">Extra</Heading>
            {extraAttempts.length === 0 ? (
                <Text>No extra attempts</Text>
            ) : (
                <AttemptsTable
                    attempts={extraAttempts}
                    fetchData={fetchData}
                    result={result}
                />
            )}

            <Heading mt={3}>Important information</Heading>
            <Alert status="info" color="black">
                <AlertIcon />
                Extra attempts should NEVER have an case set to true - we don't
                replace extra attempts by next extra, we only replace the
                original one.
            </Alert>
            <CreateAttemptModal
                isOpen={isOpenCreateAttemptModal}
                onClose={handleCloseModal}
                roundId={result.roundId}
                competitorId={result.person.id}
                timeLimit={limit!}
            />
            <SwapAttemptsModal
                isOpen={isOpenSwapAttemptsModal}
                onClose={handleCloseModal}
                attempts={standardAttempts}
            />
        </Box>
    );
};

export default SingleResult;
