                <div className={`submission-stats ${isDarkMode ? 'dark-stats' : ''}`}>
                  <div className="d-flex justify-content-between mb-1">
                    {/* <span>Score</span> */}
                    {/* <strong>{submission.total_score || submission.score || 0}/{submission.max_total_score || 10}</strong> */}
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    {/* <span>Percentage</span>
                    <strong>{(submission.overall_percentage || 0).toFixed(1)}%</strong> */}
                  </div>
                  {/* <div className="d-flex justify-content-between mb-1">
                    <span>Grade</span>
                    <Badge bg={statusInfo.color === '#34A853' ? 'success' : 
                              statusInfo.color === '#FBBC05' ? 'warning' : 'danger'}>
                      {submission.grade || 'N/A'}
                    </Badge>
                  </div> */}
                  {submission.questions_attempted !== undefined && (
                    <div className="d-flex justify-content-between">
                      {/* <span>Questions</span>
                      <span>{submission.questions_attempted || 0}/{submission.total_questions || 0}</span> */}
                    </div>
                  )}
                </div>